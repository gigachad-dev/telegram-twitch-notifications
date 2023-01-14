import Express from 'express'
import { singleton } from 'tsyringe'
import { ConfigService } from '../config/config.service.js'
import { DatabaseChannelsService } from '../database/channel.service.js'
import { TelegramCommands } from '../telegram/telegram.commands.js'
import { EventSubService } from '../twitch/eventsub.service.js'

@singleton()
export class ExpressService {
  private readonly server = Express()

  constructor(
    private readonly configService: ConfigService,
    private readonly channelsService: DatabaseChannelsService,
    private readonly eventSubService: EventSubService,
    private readonly telegramCommands: TelegramCommands
  ) {}

  async init(): Promise<void> {
    await this.eventSubService.init()
    await this.eventSubService.middleware.apply(this.server)

    this.server.get('/channels', async (req, res) => {
      res.send(this.channelsService.channels)
    })

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
