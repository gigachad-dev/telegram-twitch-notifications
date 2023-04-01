import { singleton } from 'tsyringe'
import { TelegramMiddleware } from '../telegram.middleware.js'
import { TelegramService } from '../telegram.service.js'
import type { CommandContext, Context } from 'grammy'

@singleton()
export class DeleteMessageCommand {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly telegramMiddleware: TelegramMiddleware
  ) {}

  init(): void {
    this.telegramService.command(
      'delete',
      (ctx, next) => this.telegramMiddleware.isForum(ctx, next),
      (ctx) => this.execute(ctx)
    )
  }

  private async execute(ctx: CommandContext<Context>): Promise<void> {
    if (ctx.message?.reply_to_message?.text) {
      const chatMember = await this.telegramService.api.getChatMember(
        ctx.chat.id,
        ctx.from!.id
      )
      if (
        chatMember.status === 'creator' ||
        chatMember.status === 'administrator'
      ) {
        await this.telegramService.api.deleteMessage(
          ctx.chat.id,
          ctx.message.reply_to_message.message_id
        )
      }
    }

    await this.telegramService.api.deleteMessage(
      ctx.chat.id,
      ctx.message!.message_id
    )
  }
}
