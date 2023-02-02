import { Menu } from '@grammyjs/menu'
import dedent from 'dedent'
import { CommandContext, Context } from 'grammy'
import { singleton } from 'tsyringe'
import { ConfigService } from '../config/config.service.js'
import { DatabaseChannelsService } from '../database/channels.service.js'
import { Channel } from '../entities/index.js'
import { escapeText } from '../helpers.js'
import { ApiService } from '../twitch/api.service.js'
import { EventSubService } from '../twitch/eventsub.service.js'
import { TelegramMiddleware } from './telegram.middleware.js'
import { TelegramService } from './telegram.service.js'

@singleton()
export class TelegramCommands {
  private updateStreamsMenu: Menu<Context>

  constructor(
    private readonly configService: ConfigService,
    private readonly dbChannelsService: DatabaseChannelsService,
    private readonly telegramService: TelegramService,
    private readonly telegramMiddleware: TelegramMiddleware,
    private readonly apiService: ApiService,
    private readonly eventSubService: EventSubService
  ) {}

  async init(): Promise<void> {
    // await this.applyWebhook()
    await this.telegramService.api.setMyCommands([
      {
        command: 'streams',
        description: 'Получить список стримеров.'
      }
    ])

    this.updateStreamsMenu = new Menu('update-streams-menu').text(
      'Обновить',
      async (ctx) => {
        const streams = await this.fetchStreams()
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

        await ctx.editMessageText(
          `${streams}\n\n<i>Последнее обновление: ${date}</i>`,
          {
            parse_mode: 'HTML',
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
        const channelEntity = this.dbChannelsService.data!.getChannel(
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
        this.dbChannelsService.write()
        await this.eventSubService.subscribeEvent(channel.id)
      }

      const subscribedChannels = channelsInfo
        .filter((channel) => !alreadySubscribedChannels.includes(channel.id))
        .map((channel) => `https://twitch.tv/${channel.name}`)
        .join('\n')

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
      const username = ctx.match
      if (!username) {
        throw new Error('Укажите никнейм канала.')
      }

      const channelInfo = await this.apiService.getChannelByName(username)
      if (!channelInfo) {
        throw new Error(`Канал "${username}" не найден.`)
      }

      const channelEntity = this.dbChannelsService.data!.getChannel(
        channelInfo.id
      )
      if (!channelEntity) {
        throw new Error(
          `Канал "${channelInfo.displayName}" не имеет подписки на уведомления.`
        )
      }

      this.dbChannelsService.data!.deleteChannel(channelEntity.channelId)
      this.dbChannelsService.write()
      await this.eventSubService.unsubscribeEvent(channelInfo.id)
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
    const streams = await this.fetchStreams()

    await ctx.reply(streams, {
      parse_mode: 'HTML',
      // FIXME: Bad Request: query is too old and response timeout expired or query ID is invalid
      // reply_markup: this.updateStreamsMenu,
      disable_web_page_preview: true,
      message_thread_id: ctx.message!.message_thread_id!
    })
  }

  private async fetchStreams(): Promise<string> {
    const users = await this.apiService.getUsersById(
      this.dbChannelsService.data!.getChannelIds()
    )

    const streams = await Object.values(users).reduce<Promise<string[]>>(
      async (acc, channel) => {
        const arr = await acc
        const streamInfo = await channel.getStream()
        const channelLink = `<a href="https://twitch.tv/${channel.name}">${channel.displayName}</a>`
        if (streamInfo) {
          arr.unshift(
            dedent`
              ${channelLink} ${
              streamInfo.type === 'live' ? `👀 ${streamInfo.viewers} ` : ''
            }
              ${escapeText(streamInfo.title)}${
              streamInfo.gameName ? ` — ${streamInfo.gameName}` : ''
            }\n
            `
          )
          return acc
        }
        arr.push(channelLink)
        return acc
      },
      Promise.resolve([])
    )

    return streams.length ? streams.join('\n') : 'Подписки отсутствуют.'
  }

  // private async applyWebhook(): Promise<void> {
  //   if (this.configService.isDev) {
  //     await this.telegramService.api.deleteWebhook({
  //       drop_pending_updates: true
  //     })
  //   } else {
  //     await this.telegramService.api.setWebhook(
  //       `${this.configService.serverConfig.hostname}/webhook`,
  //       {
  //         allowed_updates: ['message', 'callback_query'],
  //         drop_pending_updates: true,
  //         max_connections: 1
  //       }
  //     )
  //   }
  // }
}
