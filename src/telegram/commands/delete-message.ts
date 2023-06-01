import { TelegramMiddleware } from '../telegram.middleware.js'
import type { Bot, CommandContext, Context } from 'grammy'

export class DeleteMessageCommand {
  constructor(
    private readonly bot: Bot<Context>,
    private readonly telegramMiddleware: TelegramMiddleware
  ) {}

  init(): void {
    this.bot.command(
      'delete',
      (ctx, next) => this.telegramMiddleware.isForum(ctx, next),
      (ctx) => this.execute(ctx)
    )
  }

  private async execute(ctx: CommandContext<Context>): Promise<void> {
    if (ctx.message?.reply_to_message?.text) {
      const chatMember = await this.bot.api.getChatMember(
        ctx.chat.id,
        ctx.from!.id
      )
      if (
        chatMember.status === 'creator' ||
        chatMember.status === 'administrator'
      ) {
        await this.bot.api.deleteMessage(
          ctx.chat.id,
          ctx.message.reply_to_message.message_id
        )
      }
    }

    await this.bot.api.deleteMessage(ctx.chat.id, ctx.message!.message_id)
  }
}
