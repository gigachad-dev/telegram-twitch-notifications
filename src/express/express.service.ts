import Express from 'express'
import { env } from '../config/env.js'
import { thumbnailsPath } from '../config/paths.js'
import { EventSubService } from '../twitch/eventsub.service.js'

export class ExpressService {
  private readonly server = Express()

  constructor(private readonly eventSubService: EventSubService) {}

  async init(): Promise<void> {
    this.server.use('/thumbnails', Express.static(thumbnailsPath))
    await this.eventSubService.init()
    this.eventSubService.middleware.apply(this.server)

    this.server.listen(env.SERVER_PORT, '0.0.0.0', async () => {
      await this.eventSubService.middleware.markAsReady()
    })
  }
}
