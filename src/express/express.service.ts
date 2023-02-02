import Express from 'express'
// import { webhookCallback } from 'grammy'
import { singleton } from 'tsyringe'
import { ConfigService } from '../config/config.service.js'
import { TelegramCommands } from '../telegram/telegram.commands.js'
import { TelegramService } from '../telegram/telegram.service.js'
import { EventSubService } from '../twitch/eventsub.service.js'

@singleton()
export class ExpressService {
  private readonly server = Express()

  constructor(
    private readonly configService: ConfigService,
    private readonly eventSubService: EventSubService,
    private readonly telegramService: TelegramService,
    private readonly telegramCommands: TelegramCommands
  ) {}

  async init(): Promise<void> {
    // if (!this.configService.isDev) {
    //   this.server.use(Express.json())
    //   this.server.use(
    //     webhookCallback(this.telegramService, 'express')
    //   )
    // }

    await this.eventSubService.init()
    await this.eventSubService.middleware.apply(this.server)

    this.server.listen(
      this.configService.serverConfig.port,
      '0.0.0.0',
      async () => {
        await this.eventSubService.middleware.markAsReady()
        await this.telegramCommands.init()
      }
    )
  }
}
