import dedent from 'dedent'
import { singleton } from 'tsyringe'
import { DatabaseWatchersService } from '../../database/watchers.service.js'
import { Watcher } from '../../entities/watchers.js'
import { ApiService } from '../../twitch/api.service.js'
import { parseMatch } from '../../utils/parse-match.js'
import { TelegramMiddleware } from '../telegram.middleware.js'
import { TelegramService } from '../telegram.service.js'
import type { CommandContext, Context } from 'grammy'

type WatchersType = 'allowed_words' | 'ignored_users'

@singleton()
export class WatchersCommand {
  constructor(
    private readonly apiService: ApiService,
    private readonly telegramService: TelegramService,
    private readonly telegramMiddleware: TelegramMiddleware,
    private readonly watchersService: DatabaseWatchersService
  ) {}

  init(): void {
    this.telegramService.command(
      'watchers',
      (ctx, next) => this.telegramMiddleware.isOwner(ctx, next),
      (ctx) => this.execute(ctx)
    )
  }

  private async execute(ctx: CommandContext<Context>): Promise<void> {
    const { command, matches } = parseMatch(ctx.match)
    const input = matches.join(' ').toLowerCase()

    try {
      switch (command) {
        case undefined:
          throw this.getWatchers(ctx)
        case 'allowed_words':
          throw await this.toggleWatcherOptions(ctx, 'allowed_words', input)
        case 'ignored_users':
          throw await this.toggleWatcherOptions(ctx, 'ignored_users', input)
        default:
          throw 'Неизвестная команда.'
      }
    } catch (err) {
      ctx.reply(err as string, {
        reply_to_message_id: ctx.message?.message_id,
        message_thread_id: ctx.message?.message_thread_id
      })
    }
  }

  private getWatchers(ctx: CommandContext<Context>): string {
    const watchers = this.watchersService.findWatchers(ctx.chat.id)
    if (!watchers) return 'У вас отсутствуют подписки.'

    return dedent`
      allowed_words: ${watchers.allowed_words.join(', ')}
      ignored_users: ${watchers.ignored_users.join(', ')}
    `
  }

  private async toggleWatcherOptions(
    ctx: CommandContext<Context>,
    type: WatchersType,
    input: string
  ): Promise<string> {
    if (!input) return 'Укажите запрос на добавление/удаление.'

    const watchers = this.watchersService.findWatchers(ctx.chat.id)
    if (watchers) {
      if (type === 'ignored_users') {
        const channelInfo = await this.apiService.getChannelByName(input)
        if (!channelInfo) return 'Такого пользователя не существует.'
      }

      const index = watchers[type].indexOf(input)
      if (index !== -1) {
        watchers[type].splice(index, 1)
      } else {
        watchers[type].push(input)
      }
    } else {
      const newWatchersOptions =
        type === 'allowed_words'
          ? new Watcher(ctx.chat.id, [input])
          : new Watcher(ctx.chat.id, [], [input])

      this.watchersService.data.push(newWatchersOptions)
    }

    await this.watchersService.write()
    return 'Сохранено!'
  }
}
