import { ApiClient } from '@twurple/api'
import { ClientCredentialsAuthProvider } from '@twurple/auth'
import { EventSubMiddleware } from '@twurple/eventsub-http'
import { differenceInSeconds } from 'date-fns'
import { singleton } from 'tsyringe'
import { ConfigService } from '../config/config.service.js'
import { DatabaseChannelsService } from '../database/channels.service.js'
import { Channel } from '../entities/index.js'
import { generateNotificationMessage } from '../helpers.js'
import { NgrokHostname } from '../ngrok.js'
import { TelegramService } from '../telegram/telegram.service.js'
import { ApiService } from './api.service.js'
import type { HelixChannel } from '@twurple/api'
import type {
  EventSubChannelUpdateEvent,
  EventSubStreamOfflineEvent,
  EventSubStreamOnlineEvent,
  EventSubSubscription
} from '@twurple/eventsub'
import type { GrammyError } from 'grammy'

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
    private readonly dbChannelsService: DatabaseChannelsService,
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
      hostName: await NgrokHostname(this.configService),
      pathPrefix: '/twitch',
      strictHostCheck: true,
      secret: clientSecret
    })

    await apiClient.eventSub.deleteAllSubscriptions()
  }

  get middleware(): EventSubMiddleware {
    return this.eventsub
  }

  private getChatId(channelEntity: Channel): number {
    return this.configService.isDev
      ? channelEntity.chatId
      : this.configService.telegramTokens.chatId
  }

  private getThreadId(channelEntity: Channel): number | undefined {
    return this.configService.isDev ? undefined : channelEntity.chatId
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

  async unsubscribeEvent(channelId: string): Promise<void> {
    const events = this.events.get(channelId)
    if (!events) return

    await events.onlineEvent.stop()
    await events.offlineEvent.stop()
    await events.updateEvent.stop()

    this.events.delete(channelId)
  }

  private async onUpdateChannel(
    event: EventSubChannelUpdateEvent
  ): Promise<void> {
    const channelInfo = await this.apiService.getChannelInfoById(
      event.broadcasterId
    )
    if (!channelInfo) return

    const channelEntity = this.dbChannelsService.data!.getChannel(
      event.broadcasterId
    )
    if (!channelEntity?.stream || channelEntity.stream.endedAt) return

    const photoDescription = generateNotificationMessage({
      game: channelInfo.gameName,
      title: channelInfo.title,
      username: channelInfo.displayName
    })

    try {
      await this.telegramService.api.editMessageCaption(
        this.getChatId(channelEntity),
        channelEntity.stream.messageId,
        { parse_mode: 'HTML', caption: photoDescription }
      )
    } catch (err) {
      console.log('editMessage:', err)

      if ((err as GrammyError)?.error_code === 400) {
        this.sendMessage(channelInfo, channelEntity)
      }
    }

    channelEntity.updateStream({
      title: event.streamTitle,
      game: event.categoryName
    })

    await this.dbChannelsService.write()
  }

  private async onStreamOnline(
    event: EventSubStreamOnlineEvent
  ): Promise<void> {
    if (event.type !== 'live') return

    const channelInfo = await this.apiService.getChannelInfoById(
      event.broadcasterId
    )
    if (!channelInfo) return

    const channelEntity = this.dbChannelsService.data!.getChannel(
      channelInfo.id
    )
    if (!channelEntity) return

    if (channelEntity.stream?.endedAt) {
      const createdAt = new Date()
      const differenceSeconds = differenceInSeconds(
        createdAt,
        channelEntity.stream.endedAt
      )

      if (differenceSeconds <= this.configService.minStreamDuration) {
        this.editMessage(channelInfo, channelEntity)
        return
      }
    }

    this.sendMessage(channelInfo, channelEntity)
  }

  async editMessage(
    channelInfo: HelixChannel,
    channelEntity: Channel
  ): Promise<void> {
    const photoDescription = generateNotificationMessage({
      game: channelInfo.gameName,
      title: channelInfo.title,
      username: channelInfo.displayName
    })

    try {
      await this.telegramService.api.editMessageCaption(
        this.getChatId(channelEntity),
        channelEntity.stream!.messageId,
        { parse_mode: 'HTML', caption: photoDescription }
      )
    } catch (err) {
      console.log('editMessage:', err)

      if ((err as GrammyError)?.error_code === 400) {
        this.sendMessage(channelInfo, channelEntity)
      }
    }

    channelEntity.updateStream({
      title: channelInfo.title,
      game: channelInfo.gameName,
      endedAt: null
    })

    await this.dbChannelsService.write()
  }

  async sendMessage(
    channelInfo: HelixChannel,
    channelEntity: Channel
  ): Promise<void> {
    const streamThumbnailUrl = this.apiService.getThumbnailUrl(channelInfo.name)

    const sendedMessage = await this.telegramService.api.sendPhoto(
      this.getChatId(channelEntity),
      streamThumbnailUrl,
      {
        parse_mode: 'HTML',
        caption: generateNotificationMessage({
          game: channelInfo.gameName,
          title: channelInfo.title,
          username: channelInfo.displayName
        }),
        message_thread_id: this.getThreadId(channelEntity),
        disable_notification: this.configService.isDev
      }
    )

    channelEntity.updateStream({
      title: channelInfo.title,
      game: channelInfo.gameName,
      messageId: sendedMessage.message_id,
      createdAt: new Date(),
      endedAt: null
    })

    await this.dbChannelsService.write()
  }

  private async onStreamOffline(
    event: EventSubStreamOfflineEvent
  ): Promise<void> {
    const channelInfo = await event.getBroadcaster()
    const channelEntity = this.dbChannelsService.data!.getChannel(
      channelInfo.id
    )
    if (!channelEntity?.stream || channelEntity.stream.endedAt) return

    const endedAt = new Date()
    const photoDescription = generateNotificationMessage({
      game: channelEntity.stream.game,
      title: channelEntity.stream.title,
      username: channelInfo.displayName,
      createdAt: channelEntity.stream.createdAt,
      endedAt
    })

    try {
      await this.telegramService.api.editMessageCaption(
        this.getChatId(channelEntity),
        channelEntity.stream!.messageId,
        { parse_mode: 'HTML', caption: photoDescription }
      )
    } catch (err) {
      console.log('onStreamOffline:', err)
    }

    channelEntity.updateStream({ endedAt })
    await this.dbChannelsService.write()
  }
}
