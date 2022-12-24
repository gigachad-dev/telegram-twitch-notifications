import { ApiClient } from '@twurple/api'
import { ClientCredentialsAuthProvider } from '@twurple/auth'
import { EventSubMiddleware, EventSubSubscription } from '@twurple/eventsub'
import Ngrok from 'ngrok'
import { config } from '../config.js'

interface ChannelEvents {
  onlineEvent: EventSubSubscription<unknown>
  offlineEvent: EventSubSubscription<unknown>
}

export class EventSub {
  private _eventSubMiddleware: EventSubMiddleware
  private events = new Map<string, ChannelEvents>()

  async initialize() {
    const authProvider = new ClientCredentialsAuthProvider(
      config.CLIENT_ID,
      config.CLIENT_SECRET
    )

    const apiClient = new ApiClient({ authProvider })

    this._eventSubMiddleware = new EventSubMiddleware({
      apiClient,
      hostName: await this.getHostName(),
      pathPrefix: '/twitch',
      strictHostCheck: true,
      secret: config.CLIENT_SECRET
    })
  }

  async subscribeEvent(channelId: string): Promise<void> {
    if (this.events.has(channelId)) return
    const onlineEvent =
      await this._eventSubMiddleware.subscribeToStreamOnlineEvents(
        channelId,
        console.dir
      )
    const offlineEvent =
      await this._eventSubMiddleware.subscribeToStreamOfflineEvents(
        channelId,
        console.dir
      )
    this.events.set(channelId, { onlineEvent, offlineEvent })
  }

  async unsubscribeEvent(channelId: string): Promise<void> {
    if (!this.events.has(channelId)) return
    const events = this.events.get(channelId)
    await events.onlineEvent.stop()
    await events.offlineEvent.stop()
    this.events.delete(channelId)
  }

  get middleware() {
    return this._eventSubMiddleware
  }

  private async getHostName() {
    let hostName = ''

    if (config.isDev) {
      const tunnel = await Ngrok.connect(3003)
      hostName = tunnel.replace('https://', '')
    } else {
      hostName = `eventsub.${config.HOSTNAME.replace('https://', '')}`
    }

    return hostName
  }
}
