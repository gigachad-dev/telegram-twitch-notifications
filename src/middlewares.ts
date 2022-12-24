import { Context, NextFunction } from 'grammy'
import { config } from './config.js'

export async function checkBotOwner(ctx: Context, next: NextFunction) {
  if (ctx.from.id !== config.BOT_OWNER_ID) return
  await next()
}
