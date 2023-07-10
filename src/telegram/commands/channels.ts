import dedent from 'dedent'
import { Channel } from '../../database/channel/channels.schema.js'
import { databaseChannels } from '../../database/index.js'
import { ApiService } from '../../twitch/api.service.js'
import { EventSubService } from '../../twitch/eventsub.service.js'
import { channelsMessage } from '../../utils/messages.js'
import { parseMatch } from '../../utils/parse-match.js'
import { TelegramMiddleware } from '../telegram.middleware.js'
import type { ChatClient } from '@twurple/chat'
import type { Bot, CommandContext, Context } from 'grammy'

export class ChannelsCommand {
  private chatClient: ChatClient

  constructor(
    private readonly bot: Bot<Context>,
    private readonly apiService: ApiService,
    private readonly eventSubService: EventSubService,
    private readonly telegramMiddleware: TelegramMiddleware
  ) {}

  init(chatClient: ChatClient): void {
    this.chatClient = chatClient

    this.bot.command(
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

    try {
      switch (command) {
        case undefined: // channels
          return this.getChannels(ctx)
        case 'add': // channels add
          return this.addChannel(ctx, matches)
        case 'remove': // chaennels remove
          return this.removeChannel(ctx, matches.at(0) ?? '')
        default: {
          ctx.reply('Неизвестная команда.', {
            reply_to_message_id: ctx.message?.message_id,
            message_thread_id: ctx.message?.message_thread_id
          })
        }
      }
    } catch (err) {
      console.log(`[channels] ${command} ${matches.join(' ')}`, err)
    }
  }

  private async getChannels(ctx: CommandContext<Context>): Promise<void> {
    const channels = databaseChannels.data!.channels
    const replyParams = {
      reply_to_message_id: ctx.message?.message_id,
      message_thread_id: ctx.message?.message_thread_id
    }

    if (!channels.length) {
      ctx.reply('Нет каналов.', replyParams)
      return
    }

    ctx.reply(channelsMessage(channels), {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      ...replyParams
    })
  }

  private async addChannel(
    ctx: CommandContext<Context>,
    matches: string[]
  ): Promise<void> {
    const replyParams = {
      disable_web_page_preview: true,
      reply_to_message_id: ctx.message?.message_id,
      message_thread_id: ctx.message?.message_thread_id
    }

    if (!matches.length) {
      ctx.reply('Укажите никнейм канала.', replyParams)
      return
    }

    const channelsInfo = await this.apiService.getChannelsByNames(matches)
    if (!channelsInfo.length) {
      ctx.reply(`Каналы ${matches.join(', ')} не найдены.`, replyParams)
      return
    }

    const alreadySubscribedChannels: string[] = []
    for (const channel of channelsInfo) {
      const channelEntity = databaseChannels.data!.getChannelById(channel.id)

      if (channelEntity) {
        alreadySubscribedChannels.push(channel.id)
        continue
      }

      const newChannel = new Channel()
      newChannel.channelId = channel.id
      newChannel.displayName = channel.displayName
      newChannel.chatId = ctx.message?.message_thread_id || ctx.chat.id

      databaseChannels.data?.addChannel(newChannel)
      await databaseChannels.write()
      await this.eventSubService.subscribeEvent(channel.id)
    }

    const subscribedChannels = channelsInfo
      .filter((channel) => !alreadySubscribedChannels.includes(channel.id))
      .map((channel) => `https://twitch.tv/${channel.name}`)
      .join('\n')

    for (const username of matches) {
      await this.chatClient.join(username)
    }

    ctx.reply(
      dedent`
        Подписка на уведомления успешно создана.\n
        ${subscribedChannels}
      `,
      replyParams
    )
  }

  private async removeChannel(
    ctx: CommandContext<Context>,
    matches: string
  ): Promise<void> {
    const replyParams = {
      reply_to_message_id: ctx.message?.message_id,
      message_thread_id: ctx.message?.message_thread_id
    }

    if (!matches.length) {
      ctx.reply('Укажите никнейм канала.', replyParams)
      return
    }

    const channel = databaseChannels.data!.getChannelByName(matches)
    if (!channel) {
      ctx.reply('Канал не найден.', replyParams)
      return
    }

    databaseChannels.data!.deleteChannel(channel.channelId)
    await databaseChannels.write()
    await this.eventSubService.unsubscribeEvent(channel.channelId)
    this.chatClient.part(channel.displayName)

    ctx.reply('Канал отписан от уведомлений.', replyParams)
  }
}
