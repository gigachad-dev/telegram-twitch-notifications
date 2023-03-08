import dedent from 'dedent'
import { singleton } from 'tsyringe'
import { DatabaseChannelsService } from '../../database/channels.service.js'
import { Channel } from '../../entities/channels.js'
import { ApiService } from '../../twitch/api.service.js'
import { EventSubService } from '../../twitch/eventsub.service.js'
import { channelsMessage } from '../../utils/messages.js'
import { parseMatch } from '../../utils/parse-match.js'
import { TelegramMiddleware } from '../telegram.middleware.js'
import { TelegramService } from '../telegram.service.js'
import type { ChatClient } from '@twurple/chat'
import type { CommandContext, Context } from 'grammy'

@singleton()
export class ChannelsCommand {
  private chatClient: ChatClient

  constructor(
    private readonly telegramService: TelegramService,
    private readonly telegramMiddleware: TelegramMiddleware,
    private readonly eventSubService: EventSubService,
    private readonly apiService: ApiService,
    private readonly channelsService: DatabaseChannelsService
  ) {}

  init(chatClient: ChatClient): void {
    this.chatClient = chatClient

    this.telegramService.command(
      'channels',
      (ctx, next) => {
        const { command } = parseMatch(ctx.match)

        switch (command) {
          case 'add':
          case 'remove':
            return this.telegramMiddleware.isOwner(ctx, next)
          default:
            return this.telegramMiddleware.isForum(ctx, next)
        }
      },
      (ctx) => this.execute(ctx)
    )
  }

  private async execute(ctx: CommandContext<Context>): Promise<void> {
    const { command, matches } = parseMatch(ctx.match)

    switch (command) {
      case undefined: // channels
        return this.getChannels(ctx)
      case 'add': // channels add
        return this.addChannel(ctx, matches)
      case 'remove': // chaennels remove
        return this.removeChannel(ctx, matches)
      default:
        ctx.reply('Неизвестная команда.', {
          reply_to_message_id: ctx.message?.message_id,
          message_thread_id: ctx.message?.message_thread_id
        })
    }
  }

  private async getChannels(ctx: CommandContext<Context>): Promise<void> {
    const channels = this.channelsService.data!.channels
    if (!channels.length) {
      ctx.reply('Нет каналов.', {
        reply_to_message_id: ctx.message?.message_id,
        message_thread_id: ctx.message?.message_thread_id
      })
      return
    }

    ctx.reply(channelsMessage(channels), {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_to_message_id: ctx.message?.message_id,
      message_thread_id: ctx.message?.message_thread_id
    })
  }

  private async addChannel(
    ctx: CommandContext<Context>,
    matches: string[]
  ): Promise<void> {
    try {
      if (!matches.length) {
        throw new Error('Укажите никнейм канала.')
      }

      const channelsInfo = await this.apiService.getChannelsByNames(matches)
      if (!channelsInfo.length) {
        throw new Error(`Каналы ${matches.join(', ')} не найдены.`)
      }

      const alreadySubscribedChannels: string[] = []
      for (const channel of channelsInfo) {
        const channelEntity = this.channelsService.data!.getChannelById(
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

        this.channelsService.data?.addChannel(newChannel)
        await this.channelsService.write()
        await this.eventSubService.subscribeEvent(channel.id)
      }

      const subscribedChannels = channelsInfo
        .filter((channel) => !alreadySubscribedChannels.includes(channel.id))
        .map((channel) => `https://twitch.tv/${channel.name}`)
        .join('\n')

      for (const username of matches) {
        await this.chatClient.join(username)
      }

      throw new Error(dedent`
        Подписка на уведомления успешно создана.\n
        ${subscribedChannels}
      `)
    } catch (err) {
      ctx.reply((err as Error).message, {
        disable_web_page_preview: true,
        reply_to_message_id: ctx.message?.message_id,
        message_thread_id: ctx.message?.message_thread_id
      })
    }
  }

  private async removeChannel(
    ctx: CommandContext<Context>,
    matches: string[]
  ): Promise<void> {
    try {
      if (!matches.length) {
        throw new Error('Укажите никнейм канала.')
      }

      const channelInfo = await this.apiService.getChannelsByNames(matches)
      if (!channelInfo.length) {
        throw new Error('Канал не найден.')
      }

      for (const channel of channelInfo) {
        const channelEntity = this.channelsService.data!.getChannelById(
          channel.id
        )
        if (!channelEntity) {
          throw new Error(
            `Канал "${channel.displayName}" не имеет подписки на уведомления.`
          )
        }

        this.channelsService.data!.deleteChannel(channelEntity.channelId)
        await this.channelsService.write()
        await this.eventSubService.unsubscribeEvent(channel.id)
        this.chatClient.part(channel.displayName)
      }

      throw new Error(`Канал отписан от уведомлений.`)
    } catch (err) {
      ctx.reply((err as Error).message, {
        reply_to_message_id: ctx.message?.message_id,
        message_thread_id: ctx.message?.message_thread_id
      })
    }
  }
}
