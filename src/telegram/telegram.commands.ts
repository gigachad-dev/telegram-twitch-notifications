import { Menu } from '@grammyjs/menu'
import { ChatClient } from '@twurple/chat'
import dedent from 'dedent'
import { CommandContext, Context } from 'grammy'
import { md } from 'telegram-escape'
import { singleton } from 'tsyringe'
import { ConfigService } from '../config/config.service.js'
import { DatabaseChannelsService } from '../database/channels.service.js'
import { DatabaseWatchersService } from '../database/watcher.service.js'
import { Channel } from '../entities/index.js'
import { Watcher } from '../entities/watchers.js'
import { getRandomEmoji, RLUCache } from '../helpers.js'
import { ApiService } from '../twitch/api.service.js'
import { EventSubService } from '../twitch/eventsub.service.js'
import { TelegramMiddleware } from './telegram.middleware.js'
import { TelegramService } from './telegram.service.js'

@singleton()
export class TelegramCommands {
  private readonly cache = new RLUCache(300 * 1000)
  private updateStreamsMenu: Menu<Context>
  private chatClient: ChatClient

  constructor(
    private readonly configService: ConfigService,
    private readonly dbChannelsService: DatabaseChannelsService,
    private readonly dbWatchersService: DatabaseWatchersService,
    private readonly telegramService: TelegramService,
    private readonly telegramMiddleware: TelegramMiddleware,
    private readonly apiService: ApiService,
    private readonly eventSubService: EventSubService
  ) {}

  applyChatClient(chatClient: ChatClient): void {
    this.chatClient = chatClient
  }

  async init(): Promise<void> {
    await this.telegramService.api.setMyCommands([
      {
        command: 'streams',
        description: 'Получить список стримеров.'
      }
    ])

    this.updateStreamsMenu = new Menu('update-streams-menu').text(
      'Обновить',
      async (ctx) => {
        const { streams, cache } = await this.fetchStreams()
        const date = new Date().toLocaleString('ru-RU', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          timeZone: 'Europe/Moscow',
          hour12: false
        })

        const cacheIndicator = cache ? ` (${getRandomEmoji()})` : ''

        await ctx.editMessageText(
          `${streams}\n\n_Последнее обновление: ${date}_${cacheIndicator}`,
          {
            parse_mode: 'Markdown',
            disable_web_page_preview: true
          }
        )
      }
    )

    this.telegramService.use(this.updateStreamsMenu)

    this.telegramService.command(
      'add',
      (ctx, next) => this.telegramMiddleware.isOwner(ctx, next),
      (ctx) => this.addCommand(ctx)
    )

    this.telegramService.command(
      'watcher',
      (ctx, next) => this.telegramMiddleware.isOwner(ctx, next),
      (ctx) => this.toggleWatcher(ctx)
    )

    this.telegramService.command(
      'watchers',
      (ctx, next) => this.telegramMiddleware.isOwner(ctx, next),
      (ctx) => this.watchersList(ctx)
    )

    this.telegramService.command(
      ['remove', 'delete'],
      (ctx, next) => this.telegramMiddleware.isOwner(ctx, next),
      (ctx) => this.removeCommand(ctx)
    )

    this.telegramService.command(
      ['streams', 'channels'],
      (ctx, next) => this.telegramMiddleware.isForum(ctx, next),
      (ctx) => this.streamsCommand(ctx)
    )

    await this.telegramService.initialize(this.eventSubService)
  }

  private async toggleWatcher(ctx: CommandContext<Context>): Promise<void> {
    const matches = ctx.match.split(' ').filter(Boolean)
    const command = matches.shift()
    const input = matches.join(' ')

    switch (command) {
      case 'add':
        this.addWatcher(ctx, input)
        break
      case 'remove':
        this.removeWatcher(ctx, input)
        break
      default:
        ctx.reply('Неизвестная команда.')
    }
  }

  async watchersList(ctx: CommandContext<Context>): Promise<void> {
    const watchers = this.dbWatchersService.data.find((watcher) => {
      return watcher.chatId === ctx.chat.id
    })
    if (!watchers || !watchers.matches.length) {
      await ctx.reply('Нет watcher-ов.')
      return
    }

    await ctx.reply(`Matches: ${watchers.matches.join(', ')}`)
  }

  private async removeWatcher(
    ctx: CommandContext<Context>,
    input: string
  ): Promise<void> {
    try {
      if (!input) {
        throw new Error('Укажите запрос на удаление из watcher.')
      }

      const watcher = this.dbWatchersService.data.find((watcher) => {
        return watcher.chatId === ctx.chat.id
      })

      if (!watcher) {
        throw new Error('Watcher не найден.')
      }

      const index = watcher.matches.indexOf(input)
      if (index === -1) {
        throw new Error('Watcher не найден.')
      }

      watcher.matches.splice(index, 1)
      await this.dbWatchersService.write()
      throw new Error('Watcher удален.')
    } catch (err) {
      ctx.reply((err as Error).message)
    }
  }

  private async addWatcher(
    ctx: CommandContext<Context>,
    input: string
  ): Promise<void> {
    try {
      if (!input) {
        throw new Error('Укажите запрос на добавление в watcher.')
      }

      const watcher = this.dbWatchersService.data.find((watcher) => {
        return watcher.chatId === ctx.chat.id
      })

      if (watcher) {
        watcher.matches.push(input)
      } else {
        this.dbWatchersService.data.push(new Watcher(ctx.chat.id, input))
      }

      await this.dbWatchersService.write()
      throw new Error('Watcher добавлен.')
    } catch (err) {
      ctx.reply((err as Error).message)
    }
  }

  private async addCommand(ctx: CommandContext<Context>): Promise<void> {
    try {
      const userNames = ctx.match.split(' ').filter(Boolean)
      if (!userNames.length) {
        throw new Error('Укажите никнейм канала.')
      }

      const channelsInfo = await this.apiService.getChannelsByNames(userNames)
      if (!channelsInfo.length) {
        throw new Error(`Каналы ${userNames.join(', ')} не найдены.`)
      }

      const alreadySubscribedChannels: string[] = []
      for (const channel of channelsInfo) {
        const channelEntity = this.dbChannelsService.data!.getChannelById(
          channel.id
        )

        if (channelEntity) {
          alreadySubscribedChannels.push(channel.id)
          continue
        }

        const newChannel = new Channel()
        newChannel.channelId = channel.id
        newChannel.displayName = channel.displayName
        newChannel.chatId = ctx.message?.message_thread_id || ctx.chat.id

        this.dbChannelsService.data?.addChannel(newChannel)
        await this.dbChannelsService.write()
        await this.eventSubService.subscribeEvent(channel.id)
      }

      const subscribedChannels = channelsInfo
        .filter((channel) => !alreadySubscribedChannels.includes(channel.id))
        .map((channel) => `https://twitch.tv/${channel.name}`)
        .join('\n')

      for (const user of userNames) {
        await this.chatClient.join(user)
      }

      throw new Error(dedent`
        Подписка на уведомления успешно создана.\n
        ${subscribedChannels}
      `)
    } catch (err) {
      ctx.reply((err as Error).message, {
        disable_web_page_preview: true,
        reply_to_message_id: ctx.message!.message_id,
        message_thread_id: ctx.message!.message_thread_id!
      })
    }
  }

  private async removeCommand(ctx: CommandContext<Context>): Promise<void> {
    try {
      const userName = ctx.match
      if (!userName) {
        throw new Error('Укажите никнейм канала.')
      }

      const channelInfo = await this.apiService.getChannelByName(userName)
      if (!channelInfo) {
        throw new Error(`Канал "${userName}" не найден.`)
      }

      const channelEntity = this.dbChannelsService.data!.getChannelById(
        channelInfo.id
      )
      if (!channelEntity) {
        throw new Error(
          `Канал "${channelInfo.displayName}" не имеет подписки на уведомления.`
        )
      }

      this.dbChannelsService.data!.deleteChannel(channelEntity.channelId)
      await this.dbChannelsService.write()
      await this.eventSubService.unsubscribeEvent(channelInfo.id)
      this.chatClient.part(userName)
      throw new Error(
        `Канал "${channelInfo.displayName}" отписан от уведомлений.`
      )
    } catch (err) {
      ctx.reply((err as Error).message, {
        reply_to_message_id: ctx.message!.message_id,
        message_thread_id: ctx.message!.message_thread_id!
      })
    }
  }

  private async streamsCommand(ctx: CommandContext<Context>): Promise<void> {
    const { streams } = await this.fetchStreams()

    await ctx.reply(streams, {
      parse_mode: 'Markdown',
      reply_markup: this.updateStreamsMenu,
      disable_web_page_preview: true,
      message_thread_id: ctx.message!.message_thread_id!
    })
  }

  private async fetchStreams(): Promise<{ streams: string; cache: boolean }> {
    const cachedStreams = this.cache.get('streams')
    if (cachedStreams) {
      return { streams: cachedStreams, cache: true }
    }

    const usersId = await this.apiService.getUsersById(
      this.dbChannelsService.data!.getChannelIds()
    )

    const streams = (
      await Object.values(usersId).reduce<Promise<string[]>>(
        async (acc, channel) => {
          const arr = await acc
          const streamInfo = await channel.getStream()
          const channelLink = `[${channel.displayName}](https://twitch.tv/${channel.name})`
          if (streamInfo) {
            arr.unshift(
              dedent`
              ${channelLink} ${
                streamInfo.type === 'live' ? `👀 ${streamInfo.viewers} ` : ''
              }
              ${md`${streamInfo.title}`}${
                streamInfo.gameName ? ` — ${streamInfo.gameName}` : ''
              }\n
            `
            )
            return acc
          }
          return acc
        },
        Promise.resolve([])
      )
    ).join('\n')

    this.cache.set('streams', streams)
    return { streams, cache: false }
  }

  async sendMessageFromTwitch(
    channel: string,
    sender: string,
    chatId: number,
    message: string
  ): Promise<void> {
    try {
      const msg = dedent`
        [${channel}](https://twitch.tv/${channel}) ⤵️
        [${sender}](https://twitch.tv/${sender}): ${md`${message}`}
      `

      await this.telegramService.api.sendMessage(chatId, msg, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    } catch (err) {
      console.log(err)
    }
  }
}
