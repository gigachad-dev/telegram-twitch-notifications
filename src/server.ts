import Express from 'express'
import type { EventSub } from './twitch/eventsub.js'

export class Server {
  private readonly server = Express()

  constructor(private readonly eventsub: EventSub) {}

  async initialize() {
    this.eventsub.middleware.apply(this.server)
    this.server.listen(3003, async () => {
      await this.eventsub.middleware.markAsReady()
    })
  }
}
