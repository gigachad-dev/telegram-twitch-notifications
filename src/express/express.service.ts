import Express from 'express'
import { singleton } from 'tsyringe'
import { ConfigService } from '../config/config.service.js'
import { EventSubService } from '../twitch/eventsub.service.js'

@singleton()
export class ExpressService {
  private readonly server = Express()

  constructor(
    private readonly configService: ConfigService,
    private readonly eventSubService: EventSubService
  ) {}

  async init(): Promise<void> {
    const { port, hostname } = this.configService.serverConfig
    this.eventSubService.middleware.apply(this.server)
    this.server.listen(port, hostname, async () => {
      await this.eventSubService.middleware.markAsReady()
    })
  }
}
