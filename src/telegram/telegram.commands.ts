import dedent from 'dedent'
import { CommandContext, Context } from 'grammy'
import { singleton } from 'tsyringe'
import { DatabaseService } from '../database/database.service.js'
import { ApiService } from '../twitch/api.service.js'
import { EventSubService } from '../twitch/eventsub.service.js'
import { TelegramMiddleware } from './telegram.middleware.js'
import { TelegramService } from './telegram.service.js'

@singleton()
export class TelegramCommands {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly telegramService: TelegramService,
    private readonly telegramMiddleware: TelegramMiddleware,
    private readonly apiService: ApiService,
    private readonly eventSubService: EventSubService
  ) {}

  async initialize(): Promise<void> {
    await this.telegramService.api.setMyCommands([
      {
        command: 'streams',
        description: 'Получить список стримеров.'
      }
    ])

    this.telegramService.command(
      'add',
      this.telegramMiddleware.isOwner,
      this.addCommand.bind(this)
    )

    this.telegramService.command(
      ['remove', 'delete'],
      this.telegramMiddleware.isOwner,
      this.removeCommand.bind(this)
    )

    this.telegramService.command(
      ['streams', 'channels'],
      this.telegramMiddleware.botTyping,
      this.streamsCommand.bind(this)
    )

    await this.telegramService.initialize(this.eventSubService)
  }

  private async addCommand(ctx: CommandContext<Context>): Promise<void> {
    try {
      const username = ctx.match
      if (!username) {
        throw new Error('Укажите никнейм канала.')
      }

      const channelInfo = await this.apiService.getChannelByName(username)
      if (!channelInfo) {
        throw new Error(`Канал "${username}" не найден.`)
      }

      const channelEntity = await this.databaseService.getChannel(
        channelInfo.id
      )
      if (channelEntity) {
        throw new Error(
          `Канал "${channelInfo.displayName}" уже имеет подписку на уведомления.`
        )
      }

      await this.databaseService.addChannel({
        id: channelInfo.id,
        topicId: ctx.message!.message_thread_id!
      })

      await this.eventSubService.subscribeEvent(channelInfo.id)
      throw new Error(
        `Подписка на уведомления для канала "${channelInfo.displayName}" успешно создана.`
      )
    } catch (err) {
      ctx.reply((err as Error).message, {
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
      const channelEntity = await this.databaseService.getChannel(
        channelInfo.id
      )
      if (!channelEntity) {
        throw new Error(
          `Канал "${channelInfo.displayName}" не имеет подписки на уведомления.`
        )
      }
      await this.databaseService.deleteChannel(channelEntity.id)
      await this.eventSubService.unsubscribeEvent(channelInfo.id)
      throw new Error(
        `Канал "${channelInfo.displayName}" отписан от уведомлений.`
      )
    } catch (err) {
      ctx.reply((err as Error).message, {
        message_thread_id: ctx.message!.message_thread_id!
      })
    }
  }

  private async streamsCommand(ctx: CommandContext<Context>): Promise<void> {
    const channels = await this.databaseService.getStreams()

    const users = await this.apiService.getUsersById(
      channels.map((channel) => channel.id)
    )
    const message = await Object.values(users).reduce<Promise<string[]>>(
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
              ${streamInfo.title}${
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

    ctx.reply(
      message.length ? message.join('\n') : 'Подписки на каналы отсутствуют.',
      {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        message_thread_id: ctx.message!.message_thread_id!
      }
    )
  }
}
