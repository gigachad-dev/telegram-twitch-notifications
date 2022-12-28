import { ApiClient } from '@twurple/api'
import { ClientCredentialsAuthProvider } from '@twurple/auth'
import { EventSubMiddleware } from '@twurple/eventsub-http'
import dedent from 'dedent'
import Ngrok from 'ngrok'
import { singleton } from 'tsyringe'
import { ConfigService } from '../config/config.service.js'
import { DatabaseService } from '../database/database.service.js'
import { TelegramService } from '../telegram/telegram.service.js'
import type { Channel } from '../entities/index.js'
import type { HelixStream } from '@twurple/api'
import type {
  EventSubStreamOfflineEvent,
  EventSubStreamOnlineEvent,
  EventSubSubscription
} from '@twurple/eventsub'

interface ChannelEvents {
  onlineEvent: EventSubSubscription<unknown>
  offlineEvent: EventSubSubscription<unknown>
}

@singleton()
export class EventSubService {
  private eventsub: EventSubMiddleware
  private readonly events = new Map<string, ChannelEvents>()

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly telegramService: TelegramService
  ) {}

  async init(): Promise<void> {
    const { clientId, clientSecret } = this.configService.twitchTokens
    const authProvider = new ClientCredentialsAuthProvider(
      clientId,
      clientSecret
    )

    const apiClient = new ApiClient({ authProvider })

    this.eventsub = new EventSubMiddleware({
      apiClient,
      hostName: await this.getHostName(),
      pathPrefix: '/twitch',
      strictHostCheck: true,
      secret: clientSecret
    })

    await apiClient.eventSub.deleteAllSubscriptions()
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

  async unsubscribeEvent(channelId: string): Promise<void> {
    const events = this.events.get(channelId)
    if (!events) return

    await events.onlineEvent.stop()
    await events.offlineEvent.stop()

    this.events.delete(channelId)
  }

  private async onStreamOnline(
    event: EventSubStreamOnlineEvent
  ): Promise<void> {
    const streamInfo = await event.getStream()
    const channelEntity = await this.databaseService.getChannel(streamInfo.id)
    if (!channelEntity) return

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

    const sendedMessage = await this.telegramService.api.sendPhoto(
      this.configService.telegramTokens.chatId,
      `${streamThumbnailUrl}?timestamp=${Date.now()}`,
      {
        caption: photoDescription,
        message_thread_id: channelEntity.topicId,
        disable_notification: this.configService.isDev
      }
    )

    await this.databaseService.upsertStream({
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
    const channelEntity = await this.databaseService.getChannel(channelInfo.id)
    if (!channelEntity?.stream) return

    const photoDescription = this.generateDescription({
      game: channelEntity.stream.game,
      title: channelEntity.stream.title,
      username: channelInfo.displayName,
      ended: true
    })

    try {
      await this.telegramService.api.editMessageCaption(
        this.configService.telegramTokens.chatId,
        channelEntity.stream.messageId,
        { caption: photoDescription }
      )
    } catch {}

    await this.databaseService.deleteStream(channelEntity.id)
  }

  private generateDescription({
    title,
    game,
    username,
    ended
  }: {
    title: string | null
    game: string | null
    username: string
    ended: boolean
  }): string {
    return dedent`
      ${ended ? '🔴' : '🟢'} ${title ?? username}${game ? ` — ${game}` : ''}
      https://twitch.tv/${username.toLowerCase()}
    `
  }

  private async getHostName(): Promise<string> {
    const { hostname, port } = this.configService.serverConfig

    if (this.configService.isDev) {
      await Ngrok.disconnect()
      const tunnel = await Ngrok.connect(port)
      return tunnel.replace('https://', '')
    }

    return hostname.replace('https://', '')
  }
}
