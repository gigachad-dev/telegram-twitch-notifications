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

    const hostname = env.isDev ? env.SERVER_HOSTNAME : '0.0.0.0'
    this.server.listen(env.SERVER_PORT, hostname, async () => {
      await this.eventSubService.listener.markAsReady()
      await this.eventSubService.addAllSubscriptions()

      console.log('Server is listening on port', env.SERVER_PORT)
    })
  }
}
