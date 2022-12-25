import { config } from './config.js'
import type { Context, NextFunction } from 'grammy'

export async function isOwner(ctx: Context, next: NextFunction) {
  if (ctx.from.id !== config.BOT_OWNER_ID) return
  await next()
}

export async function botTyping(ctx: Context, next: NextFunction) {
  await ctx.replyWithChatAction('typing')
  await next()
}
