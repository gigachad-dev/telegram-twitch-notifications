import 'reflect-metadata'
import { Bot } from 'grammy'
import { config } from './config.js'
import { database } from './database.js'
import { Channel } from './entities/index.js'
import { checkBotOwner } from './middlewares.js'
import { Server } from './server.js'
import { AuthProvider, EventSub, TwitchApiClient } from './twitch/index.js'

await database.initialize()
await database.runMigrations()
const channelRepository = database.getRepository(Channel)

const bot = new Bot(config.BOT_TOKEN)
const server = new Server()
await server.initialize()

const auth = new AuthProvider()
await auth.initialize()

const eventsub = new EventSub(bot, channelRepository)
await eventsub.initialize()

const api = new TwitchApiClient(auth.provider)

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

    const channelEntity = await channelRepository.findOneBy({
      channelId: channelInfo.id
    })

    if (channelEntity) {
      throw new Error(
        `Канал "${channelInfo.displayName}" уже имеет подписку на уведомления.`
      )
    }

    await channelRepository.insert({
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

    const channelEntity = await channelRepository.findOneBy({
      channelId: channelInfo.id
    })

    if (!channelEntity) {
      throw new Error(
        `Канал "${channelInfo.displayName}" не имеет подписки на уведомления.`
      )
    }

    await channelRepository.delete({
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
  const channels = await channelRepository.find()
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
    const channels = await channelRepository.find()
    for (const channel of channels) {
      if (!channel.stream) {
        const streamInfo = await api.getStreamById(channel.channelId)
        if (streamInfo.type === 'live') {
          eventsub.sendMessage(streamInfo, channel)
        }
      }

      await eventsub.subscribeEvent(channel.channelId)
    }
  }
})

bot.catch(console.log)
