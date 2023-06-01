import { Menu } from '@grammyjs/menu'
import dedent from 'dedent'
import { Bot, CommandContext, Context } from 'grammy'
import { databaseChannels } from '../../database/index.js'
import { ApiService } from '../../twitch/api.service.js'
import { getRandomEmoji } from '../../utils/get-random-emoji.js'
import { channelsOnlineMessage } from '../../utils/messages.js'
import { TTLCache } from '../../utils/ttl-cache.js'
import { TelegramMiddleware } from '../telegram.middleware.js'

export class StreamsCommmand {
  private readonly cache = new TTLCache(600 * 1000 /* 600 sec */)
  private refreshStreamsMenu: Menu<Context>

  constructor(
    private readonly bot: Bot<Context>,
    private readonly apiService: ApiService,
    private readonly telegramMiddleware: TelegramMiddleware
  ) {}

  init(): void {
    this.refreshStreamsMenu = new Menu('refresh-streams-menu').text(
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

        const message = dedent`
          ${streams}

          _Последнее обновление: ${date}_${
          cache ? ` (${getRandomEmoji()})` : ''
        }
        `

        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        })
      }
    )

    this.bot.use(this.refreshStreamsMenu)

    this.bot.command(
      'streams',
      (ctx, next) => this.telegramMiddleware.isForum(ctx, next),
      (ctx) => this.execute(ctx)
    )
  }

  private async execute(ctx: CommandContext<Context>): Promise<void> {
    const { streams } = await this.fetchStreams()

    if (!streams) {
      ctx.reply('Нет стримов 😢', {
        reply_to_message_id: ctx.message?.message_id,
        message_thread_id: ctx.message?.message_thread_id
      })
      return
    }

    ctx.reply(streams, {
      parse_mode: 'Markdown',
      reply_markup: this.refreshStreamsMenu,
      disable_web_page_preview: true,
      reply_to_message_id: ctx.message?.message_id,
      message_thread_id: ctx.message?.message_thread_id
    })
  }

  private async fetchStreams(): Promise<{ streams: string; cache: boolean }> {
    const cachedStreams = this.cache.get('streams')
    if (cachedStreams) return { streams: cachedStreams, cache: true }

    const channelsIds = databaseChannels
      .data!.channels.filter(
        (channel) => channel.stream && channel.stream.endedAt === null
      )
      .map((channel) => channel.channelId)

    const streams = channelsIds.length
      ? await this.apiService.getStreamsByIds(channelsIds)
      : []

    const msg = channelsOnlineMessage(streams)
    this.cache.set('streams', msg)

    return { streams: msg, cache: false }
  }
}
