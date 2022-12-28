import Express from 'express'
import { singleton } from 'tsyringe'
import { ConfigService } from '../config/config.service.js'
import { TelegramCommands } from '../telegram/telegram.commands.js'
import { EventSubService } from '../twitch/eventsub.service.js'

@singleton()
export class ExpressService {
  private readonly server = Express()

  constructor(
    private readonly configService: ConfigService,
    private readonly eventSubService: EventSubService,
    private readonly telegramCommands: TelegramCommands
  ) {}

  async init(): Promise<void> {
    await this.eventSubService.middleware.apply(this.server)
    this.server.listen(this.configService.serverConfig.port, async () => {
      await this.eventSubService.middleware.markAsReady()
      await this.telegramCommands.init()
    })
  }
}
