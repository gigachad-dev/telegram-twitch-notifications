import { ApiClient } from '@twurple/api'
import { ClientCredentialsAuthProvider } from '@twurple/auth'
import { EventSubMiddleware } from '@twurple/eventsub'
import dedent from 'dedent'
import Ngrok from 'ngrok'
import { config } from '../config.js'
import { Repositories } from '../repositories.js'
import type { Channel } from '../entities/index.js'
import type { HelixStream } from '@twurple/api'
import type {
  EventSubStreamOfflineEvent,
  EventSubStreamOnlineEvent,
  EventSubSubscription
} from '@twurple/eventsub'
import type { Api, Bot, Context, RawApi } from 'grammy'

interface ChannelEvents {
  onlineEvent: EventSubSubscription<unknown>
  offlineEvent: EventSubSubscription<unknown>
}

export class EventSub {
  private eventsub: EventSubMiddleware
  private readonly events = new Map<string, ChannelEvents>()

  constructor(private readonly bot: Bot<Context, Api<RawApi>>) {}

  async initialize() {
    const authProvider = new ClientCredentialsAuthProvider(
      config.CLIENT_ID,
      config.CLIENT_SECRET
    )

    const apiClient = new ApiClient({ authProvider })
    await apiClient.eventSub.deleteAllSubscriptions()

    this.eventsub = new EventSubMiddleware({
      apiClient,
      hostName: await this.getHostName(),
      pathPrefix: '/twitch',
      strictHostCheck: true,
      secret: config.CLIENT_SECRET
    })
  }

  get middleware(): EventSubMiddleware {
    return this.eventsub
  }

  async subscribeEvent(channelId: string): Promise<void> {
    if (this.events.has(channelId)) return
    const onlineEvent = await this.eventsub.subscribeToStreamOnlineEvents(
      channelId,
      (event) => this.onStreamOnline(event)
    )

    const offlineEvent = await this.eventsub.subscribeToStreamOfflineEvents(
      channelId,
      (event) => this.onStreamOffline(event)
    )

    this.events.set(channelId, { onlineEvent, offlineEvent })
  }

  private async onStreamOnline(
    event: EventSubStreamOnlineEvent
  ): Promise<void> {
    const streamInfo = await event.getStream()
    const channelEntity = await Repositories.getChannel(streamInfo.id)

    this.sendMessage(streamInfo, channelEntity)
  }

  async sendMessage(
    streamInfo: HelixStream,
    channelEntity: Channel
  ): Promise<void> {
    const streamThumbnailUrl = streamInfo.getThumbnailUrl(1920, 1080)
    const photoDescription = this.generateDescription({
      game: streamInfo.gameName,
      title: streamInfo.title,
      username: streamInfo.userDisplayName,
      ended: false
    })

    const sendedMessage = await this.bot.api.sendPhoto(
      config.CHAT_ID,
      `${streamThumbnailUrl}?timestamp=${Date.now()}`,
      {
        caption: photoDescription,
        message_thread_id: channelEntity.topicId,
        disable_notification: config.isDev
      }
    )

    await Repositories.upsertStream({
      channelId: channelEntity.id,
      title: streamInfo.title,
      game: streamInfo.gameName,
      messageId: sendedMessage.message_id
    })
  }

  private async onStreamOffline(
    event: EventSubStreamOfflineEvent
  ): Promise<void> {
    const channelInfo = await event.getBroadcaster()
    const channelEntity = await Repositories.getChannel(channelInfo.id)

    const photoDescription = this.generateDescription({
      game: channelEntity.stream.game,
      title: channelEntity.stream.title,
      username: channelInfo.displayName,
      ended: true
    })

    try {
      await this.bot.api.editMessageCaption(
        config.CHAT_ID,
        channelEntity.stream.messageId,
        {
          caption: photoDescription
        }
      )
    } catch {
      console.log(dedent`
        displayName: ${channelInfo.displayName}
        messageId: ${channelEntity.stream.messageId}
      `)
    }

    await Repositories.deleteStream(channelEntity.id)
  }

  private generateDescription({
    title,
    game,
    username,
    ended
  }: {
    title: string
    game?: string
    username: string
    ended: boolean
  }): string {
    return dedent`
      ${ended ? '🔴' : '🟢'} ${title ?? username}${game ? ` — ${game}` : ''}
      https://twitch.tv/${username.toLowerCase()}
    `
  }

  async unsubscribeEvent(channelId: string): Promise<void> {
    if (!this.events.has(channelId)) return
    const events = this.events.get(channelId)
    await events.onlineEvent.stop()
    await events.offlineEvent.stop()
    this.events.delete(channelId)
  }

  private async getHostName(): Promise<string> {
    let hostName = ''

    if (config.isDev) {
      await Ngrok.disconnect()
      const tunnel = await Ngrok.connect(config.PORT)
      hostName = tunnel.replace('https://', '')
    } else {
      hostName = config.HOSTNAME.replace('https://', '')
    }

    return hostName
  }
}
