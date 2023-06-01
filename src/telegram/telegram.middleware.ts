import { env } from '../config/env.js'
import type { Context, NextFunction } from 'grammy'

export class TelegramMiddleware {
  async isForum(ctx: Context, next: Function): Promise<void> {
    if (ctx.message?.chat.type === 'supergroup' && !ctx.message.chat.is_forum)
      return
    await next()
  }

  async isOwner(ctx: Context, next: NextFunction): Promise<void> {
    if (ctx.from!.id !== env.BOT_OWNER_ID) return
    await next()
  }
}
