import { ApiClient } from '@twurple/api'
import { ClientCredentialsAuthProvider } from '@twurple/auth'
import { EventSubMiddleware } from '@twurple/eventsub-http'
import Ngrok from 'ngrok'
import { singleton } from 'tsyringe'
import { ConfigService } from '../config/config.service.js'
import { DatabaseService } from '../database/database.service.js'
import { generateNotificationMessage } from '../helpers.js'
import { TelegramService } from '../telegram/telegram.service.js'
import { ApiService } from './api.service.js'
import type { Channel } from '../entities/index.js'
import type { HelixChannel } from '@twurple/api'
import type {
  EventSubChannelUpdateEvent,
  EventSubStreamOfflineEvent,
  EventSubStreamOnlineEvent,
  EventSubSubscription
} from '@twurple/eventsub'

interface ChannelEvents {
  onlineEvent: EventSubSubscription<unknown>
  offlineEvent: EventSubSubscription<unknown>
  updateEvent: EventSubSubscription<unknown>
}

@singleton()
export class EventSubService {
  private eventsub: EventSubMiddleware
  private readonly events = new Map<string, ChannelEvents>()

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly telegramService: TelegramService,
    private readonly apiService: ApiService
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

    const updateEvent = await this.eventsub.subscribeToChannelUpdateEvents(
      channelId,
      (event) => this.onUpdateChannel(event)
    )

    this.events.set(channelId, { onlineEvent, offlineEvent, updateEvent })
  }

  private async onUpdateChannel(
    event: EventSubChannelUpdateEvent
  ): Promise<void> {
    const channelEntity = await this.databaseService.getChannel(
      event.broadcasterId
    )
    if (!channelEntity?.stream) return

    const photoDescription = generateNotificationMessage({
      game: event.categoryName,
      title: event.streamTitle,
      username: event.broadcasterDisplayName,
      ended: false
    })

    try {
      await this.telegramService.api.editMessageCaption(
        this.configService.telegramTokens.chatId,
        channelEntity.stream.messageId,
        { parse_mode: 'HTML', caption: photoDescription }
      )
    } catch (err) {
      console.log(err)
    }

    await this.databaseService.upsertStream({
      channelId: channelEntity.id,
      title: event.streamTitle,
      game: event.categoryName,
      messageId: channelEntity.stream.messageId
    })
  }

  async unsubscribeEvent(channelId: string): Promise<void> {
    const events = this.events.get(channelId)
    if (!events) return

    await events.onlineEvent.stop()
    await events.offlineEvent.stop()
    await events.updateEvent.stop()

    this.events.delete(channelId)
  }

  private async onStreamOnline(
    event: EventSubStreamOnlineEvent
  ): Promise<void> {
    if (event.type !== 'live') return

    const channelInfo = await this.apiService.getChannelInfoById(
      event.broadcasterId
    )
    if (!channelInfo) return

    const channelEntity = await this.databaseService.getChannel(channelInfo.id)
    if (!channelEntity) return

    this.sendMessage(channelInfo, channelEntity)
  }

  async sendMessage(
    channelInfo: HelixChannel,
    channelEntity: Channel
  ): Promise<void> {
    const streamThumbnailUrl = this.apiService.getThumbnailUrl(channelInfo.name)
    const photoDescription = generateNotificationMessage({
      game: channelInfo.gameName,
      title: channelInfo.title,
      username: channelInfo.displayName,
      ended: false
    })

    const sendedMessage = await this.telegramService.api.sendPhoto(
      this.configService.telegramTokens.chatId,
      streamThumbnailUrl,
      {
        parse_mode: 'HTML',
        caption: photoDescription,
        message_thread_id: channelEntity.topicId,
        disable_notification: this.configService.isDev
      }
    )

    await this.databaseService.upsertStream({
      channelId: channelEntity.id,
      title: channelInfo.title,
      game: channelInfo.gameName,
      messageId: sendedMessage.message_id
    })
  }

  private async onStreamOffline(
    event: EventSubStreamOfflineEvent
  ): Promise<void> {
    const channelInfo = await event.getBroadcaster()
    const channelEntity = await this.databaseService.getChannel(channelInfo.id)
    if (!channelEntity?.stream) return

    const photoDescription = generateNotificationMessage({
      game: channelEntity.stream.game,
      title: channelEntity.stream.title,
      username: channelInfo.displayName,
      ended: true
    })

    try {
      await this.telegramService.api.editMessageCaption(
        this.configService.telegramTokens.chatId,
        channelEntity.stream.messageId,
        { parse_mode: 'HTML', caption: photoDescription }
      )
    } catch (err) {
      console.log(err)
    }

    await this.databaseService.deleteStream(channelEntity.id)
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
