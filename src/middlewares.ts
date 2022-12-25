import { config } from './config.js'
import type { Context, NextFunction } from 'grammy'

export async function checkBotOwner(ctx: Context, next: NextFunction) {
  if (ctx.from.id !== config.BOT_OWNER_ID) return
  await next()
}
