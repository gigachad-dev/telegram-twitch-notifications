import Express from 'express'
import { env } from '../config/env.js'
import { thumbnailsPath } from '../config/paths.js'
import type { EventSubService } from '../twitch/eventsub.service.js'

export class ExpressService {
  private readonly server = Express()

  constructor(private readonly eventSubService: EventSubService) {}

  init(): void {
    this.server.use('/thumbnails', Express.static(thumbnailsPath))
    // @ts-ignore
    this.eventSubService.listener.apply(this.server)

    this.server.listen(env.SERVER_PORT, env.SERVER_HOSTNAME, async () => {
      await this.eventSubService.listener.markAsReady()
      await this.eventSubService.addAllSubscriptions()
    })
  }
}
