import { singleton } from 'tsyringe'
import { ConfigService } from '../config/config.service.js'
import type { Context, NextFunction } from 'grammy'

@singleton()
export class TelegramMiddleware {
  constructor(private readonly configService: ConfigService) {}

  async isOwner(ctx: Context, next: NextFunction): Promise<void> {
    if (!ctx.message?.is_topic_message) return
    if (ctx.from!.id !== this.configService.telegramTokens.botOwnerId) return
    await next()
  }

  async botTyping(ctx: Context, next: NextFunction): Promise<void> {
    if (!ctx.message?.is_topic_message) return
    await ctx.replyWithChatAction('typing')
    await next()
  }
}
