import 'reflect-metadata'
import { Bot } from 'grammy'
import { config } from './config.js'
import { database } from './database.js'
import { checkBotOwner } from './middlewares.js'
import { Repositories } from './repositories.js'
import { Server } from './server.js'
import { ApiClient, AuthProvider, EventSub } from './twitch/index.js'

await database.initialize()
await database.runMigrations()

const bot = new Bot(config.BOT_TOKEN)

const auth = new AuthProvider()
await auth.initialize()

const eventsub = new EventSub(bot)
await eventsub.initialize()

const server = new Server(eventsub)
await server.initialize()

const api = new ApiClient(auth)

bot.use(checkBotOwner)

bot.command('subscribe', async (ctx) => {
  try {
    const username = ctx.match
    if (!username) {
      throw new Error('Укажите никнейм канала.')
    }

    const channelInfo = await api.getChannelByName(username)
    if (!channelInfo) {
      throw new Error(`Канал "${username}" не найден.`)
    }

    const channelEntity = await Repositories.channel.findOneBy({
      channelId: channelInfo.id
    })

    if (channelEntity) {
      throw new Error(
        `Канал "${channelInfo.displayName}" уже имеет подписку на уведомления.`
      )
    }

    await Repositories.channel.insert({
      channelId: channelInfo.id,
      displayName: channelInfo.displayName,
      topicId: ctx.message.message_thread_id
    })

    await eventsub.subscribeEvent(channelInfo.id)
    throw new Error(
      `Подписка на уведомления для канала "${channelInfo.displayName}" успешно создана.`
    )
  } catch (err) {
    ctx.reply((err as Error).message, {
      message_thread_id: ctx.message.message_thread_id
    })
  }
})

bot.command('unsubscribe', async (ctx) => {
  try {
    const username = ctx.match
    if (!username) {
      throw new Error('Укажите никнейм канала.')
    }

    const channelInfo = await api.getChannelByName(username)
    if (!channelInfo) {
      throw new Error(`Канал "${username}" не найден.`)
    }

    const channelEntity = await Repositories.channel.findOneBy({
      channelId: channelInfo.id
    })

    if (!channelEntity) {
      throw new Error(
        `Канал "${channelInfo.displayName}" не имеет подписки на уведомления.`
      )
    }

    await Repositories.channel.delete({
      id: channelEntity.id
    })

    await eventsub.unsubscribeEvent(channelInfo.id)
    throw new Error(
      `Канал "${channelInfo.displayName}" отписан от уведомлений.`
    )
  } catch (err) {
    ctx.reply((err as Error).message, {
      message_thread_id: ctx.message.message_thread_id
    })
  }
})

bot.command('channels', async (ctx) => {
  const channels = await Repositories.channel.find()
  const message = Object.values(channels).map((channel) => {
    return `*${channel.displayName}* — \`/unsubscribe ${channel.displayName}\``
  })

  ctx.reply(
    message.length ? message.join('\n') : 'Подписки на каналы отсутствуют.',
    {
      parse_mode: 'Markdown',
      message_thread_id: ctx.message.message_thread_id
    }
  )
})

bot.start({
  async onStart() {
    const channels = await Repositories.channel.find({
      relations: {
        stream: true
      }
    })

    console.log(channels)
    for (const channel of channels) {
      if (!channel.stream) {
        const streamInfo = await api.getStreamById(channel.channelId)
        if (streamInfo?.type === 'live') {
          eventsub.sendMessage(streamInfo, channel)
        }
      }

      await eventsub.subscribeEvent(channel.channelId)
    }
  }
})

bot.catch(console.log)
