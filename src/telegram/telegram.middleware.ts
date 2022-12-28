import { singleton } from 'tsyringe'
import { ConfigService } from '../config/config.service.js'
import type { Context, NextFunction } from 'grammy'

@singleton()
export class TelegramMiddleware {
  constructor(private readonly configService: ConfigService) {}

  async isForum(ctx: Context, next: Function): Promise<void> {
    if (ctx.message?.chat.type === 'supergroup' && !ctx.message.chat.is_forum)
      return
    await next()
  }

  async isOwner(ctx: Context, next: NextFunction): Promise<void> {
    if (ctx.from!.id !== this.configService.telegramTokens.botOwnerId) return
    await next()
  }
}
