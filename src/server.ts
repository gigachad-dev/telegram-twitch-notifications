import Express from 'express'
import { EventSub } from './twitch/eventsub.js'

export class Server {
  private readonly server = Express()

  async initialize() {
    const eventsub = new EventSub()
    await eventsub.initialize()
    eventsub.middleware.apply(this.server)

    eventsub.middleware.subscribeToStreamOnlineEvents
    eventsub.middleware.subscribeToStreamOfflineEvents

    this.server.listen(3003, async () => {
      await eventsub.middleware.markAsReady()
    })
  }
}
