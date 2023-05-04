import Express from 'express'
import { singleton } from 'tsyringe'
import { ConfigService, thumbnailsPath } from '../config/config.service.js'
import { EventSubService } from '../twitch/eventsub.service.js'

@singleton()
export class ExpressService {
  private readonly server = Express()

  constructor(
    private readonly configService: ConfigService,
    private readonly eventSubService: EventSubService
  ) {}

  async init(): Promise<void> {
    this.server.use('/thumbnails', Express.static(thumbnailsPath))
    await this.eventSubService.init()
    this.eventSubService.middleware.apply(this.server)

    this.server.listen(
      this.configService.serverConfig.port,
      '0.0.0.0',
      async () => {
        await this.eventSubService.middleware.markAsReady()
      }
    )
  }
}
