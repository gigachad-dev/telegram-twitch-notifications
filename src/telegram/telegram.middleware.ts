import { singleton } from 'tsyringe'
import { ConfigService } from '../config/config.service.js'
import type { Context, NextFunction } from 'grammy'

@singleton()
export class TelegramMiddleware {
  constructor(private readonly config: ConfigService) {}

  async isOwner(ctx: Context, next: NextFunction) {
    if (ctx.from!.id !== this.config.telegramTokens.botOwnerId) return
    await next()
  }

  async botTyping(ctx: Context, next: NextFunction) {
    await ctx.replyWithChatAction('typing')
    await next()
  }
}
