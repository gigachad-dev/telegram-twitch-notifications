import { singleton } from 'tsyringe'
import { DatabaseWatchersService } from '../../database/watcher.service.js'
import { Watcher } from '../../entities/watchers.js'
import { parseMatch } from '../../utils/parse-match.js'
import { TelegramMiddleware } from '../telegram.middleware.js'
import { TelegramService } from '../telegram.service.js'
import type { CommandContext, Context } from 'grammy'

@singleton()
export class WatchersCommand {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly telegramMiddleware: TelegramMiddleware,
    private readonly watchersService: DatabaseWatchersService
  ) {}

  init(): void {
    this.telegramService.command(
      'watcher',
      (ctx, next) => this.telegramMiddleware.isOwner(ctx, next),
      (ctx) => this.execute(ctx)
    )

    this.telegramService.command(
      'watchers',
      (ctx, next) => this.telegramMiddleware.isOwner(ctx, next),
      (ctx) => this.getWatchers(ctx)
    )
  }

  private async execute(ctx: CommandContext<Context>): Promise<void> {
    const { command, matches } = parseMatch(ctx.match)
    const input = matches.join(' ')

    switch (command) {
      case undefined: // watcher/watchers
        return this.getWatchers(ctx)
      case 'add': // watchers add
        return this.addWatcher(ctx, input)
      case 'remove': // watchers remove
        return this.removeWatcher(ctx, input)
      default:
        ctx.reply('Неизвестная команда.')
    }
  }

  private async getWatchers(ctx: CommandContext<Context>): Promise<void> {
    const watchers = this.watchersService.data.find((watcher) => {
      return watcher.chatId === ctx.chat.id
    })

    if (!watchers || !watchers.matches.length) {
      await ctx.reply('Нет watcher-ов.')
      return
    }

    await ctx.reply(`Matches: ${watchers.matches.join(', ')}`)
  }

  private async addWatcher(
    ctx: CommandContext<Context>,
    input: string
  ): Promise<void> {
    try {
      if (!input) {
        throw new Error('Укажите запрос на добавление в watcher.')
      }

      const watcher = this.watchersService.data.find((watcher) => {
        return watcher.chatId === ctx.chat.id
      })

      if (watcher) {
        watcher.matches.push(input)
      } else {
        this.watchersService.data.push(new Watcher(ctx.chat.id, input))
      }

      await this.watchersService.write()
      throw new Error('Watcher добавлен.')
    } catch (err) {
      ctx.reply((err as Error).message)
    }
  }

  private async removeWatcher(
    ctx: CommandContext<Context>,
    input: string
  ): Promise<void> {
    try {
      if (!input) {
        throw new Error('Укажите запрос на удаление из watcher.')
      }

      const watcher = this.watchersService.data.find((watcher) => {
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
      await this.watchersService.write()
      throw new Error('Watcher удален.')
    } catch (err) {
      ctx.reply((err as Error).message)
    }
  }
}
