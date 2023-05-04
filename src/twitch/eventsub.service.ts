import { EventSubMiddleware } from '@twurple/eventsub-http'
import { differenceInSeconds } from 'date-fns'
import { singleton } from 'tsyringe'
import { ConfigService } from '../config/config.service.js'
import { DatabaseChannelsService } from '../database/channels.service.js'
import { Channel } from '../entities/index.js'
import { NgrokHostname } from '../ngrok.js'
import { TelegramService } from '../telegram/telegram.service.js'
import { fetchThumbnailUrl } from '../utils/fetch-thumbnail.js'
import { notificationMessage } from '../utils/messages.js'
import { ApiService } from './api.service.js'
import type { HelixChannel } from '@twurple/api'
import type {
  EventSubChannelUpdateEvent,
  EventSubStreamOfflineEvent,
  EventSubStreamOnlineEvent,
  EventSubSubscription
} from '@twurple/eventsub-base'

interface ChannelEvents {
  onlineEvent: EventSubSubscription
  offlineEvent: EventSubSubscription
  updateEvent: EventSubSubscription
}

interface StreamEnded {
  endedAt: Date
  dispose: () => void
}

@singleton()
export class EventSubService {
  private eventsub: EventSubMiddleware
  private readonly events = new Map<string, ChannelEvents>()
  private readonly streamsEnded = new Map<string, StreamEnded>()

  constructor(
    private readonly configService: ConfigService,
    private readonly dbChannelsService: DatabaseChannelsService,
    private readonly telegramService: TelegramService,
    private readonly apiService: ApiService
  ) {}

  async init(): Promise<void> {
    this.eventsub = new EventSubMiddleware({
      apiClient: this.apiService.apiClient,
      hostName: await NgrokHostname(this.configService),
      pathPrefix: '/twitch',
      strictHostCheck: true,
      secret: this.configService.twitchTokens.clientSecret,
      legacySecrets: false
    })

    await this.apiService.apiClient.eventSub.deleteAllSubscriptions()
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

    const onlineEvent = this.eventsub.onStreamOnline(channelId, (event) =>
      this.onStreamOnline(event)
    )

    const offlineEvent = this.eventsub.onStreamOffline(channelId, (event) =>
      this.onStreamOffline(event)
    )

    const updateEvent = this.eventsub.onChannelUpdate(channelId, (event) =>
      this.onChannelUpdate(event)
    )

    this.events.set(channelId, { onlineEvent, offlineEvent, updateEvent })
  }

  async unsubscribeEvent(channelId: string): Promise<void> {
    const events = this.events.get(channelId)
    if (!events) return

    events.onlineEvent.stop()
    events.offlineEvent.stop()
    events.updateEvent.stop()

    this.events.delete(channelId)
  }

  private async onChannelUpdate(
    event: EventSubChannelUpdateEvent
  ): Promise<void> {
    const channelInfo = await this.apiService.getChannelInfoById(
      event.broadcasterId
    )
    if (!channelInfo) return

    const channelEntity = this.dbChannelsService.data!.getChannelById(
      event.broadcasterId
    )
    if (
      !channelEntity?.stream ||
      channelEntity.stream.endedAt ||
      this.streamsEnded.has(channelEntity.channelId)
    )
      return

    const photoDescription = notificationMessage({
      game: channelInfo.gameName,
      title: channelInfo.title,
      username: channelInfo.displayName
    })

    try {
      await this.telegramService.api.editMessageCaption(
        this.getChatId(channelEntity),
        channelEntity.stream.messageId,
        { caption: photoDescription }
      )
    } catch (err) {
      // console.log('editMessage:', err)
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

    const channelEntity = this.dbChannelsService.data!.getChannelById(
      channelInfo.id
    )
    if (!channelEntity) return

    const isEndedStream = this.streamsEnded.get(channelEntity.channelId)
    if (isEndedStream) isEndedStream.dispose()

    if (channelEntity.stream?.createdAt && !channelEntity.stream?.endedAt) {
      return
    }

    if (!channelEntity.stream?.endedAt) {
      this.sendMessage(channelInfo, channelEntity)
      return
    }

    const createdAt = new Date()
    const differenceSeconds = differenceInSeconds(
      createdAt,
      channelEntity.stream.endedAt
    )

    if (differenceSeconds <= 600) {
      this.editMessage(channelInfo, channelEntity)
    } else {
      this.sendMessage(channelInfo, channelEntity)
    }
  }

  async editMessage(
    channelInfo: HelixChannel,
    channelEntity: Channel
  ): Promise<void> {
    const photoDescription = notificationMessage({
      game: channelInfo.gameName,
      title: channelInfo.title,
      username: channelInfo.displayName
    })

    try {
      await this.telegramService.api.editMessageCaption(
        this.getChatId(channelEntity),
        channelEntity.stream!.messageId,
        { caption: photoDescription }
      )
    } catch (err) {
      console.log('editMessage', err)
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
    const thumbnailUrl = await fetchThumbnailUrl(
      this.configService.serverConfig.public,
      channelInfo.name
    )

    const sendedMessage = await this.telegramService.api.sendPhoto(
      this.getChatId(channelEntity),
      thumbnailUrl,
      {
        caption: notificationMessage({
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
    const channelEntity = this.dbChannelsService.data!.getChannelById(
      channelInfo.id
    )
    if (!channelEntity?.stream || channelEntity.stream.endedAt) return

    const endedAt = new Date()
    const photoDescription = notificationMessage({
      game: channelEntity.stream.game,
      title: channelEntity.stream.title,
      username: channelInfo.displayName,
      createdAt: channelEntity.stream.createdAt,
      endedAt
    })

    const editMessage = async () => {
      try {
        await this.telegramService.api.editMessageCaption(
          this.getChatId(channelEntity),
          channelEntity.stream!.messageId,
          { caption: photoDescription }
        )
      } catch (err) {
        // console.log('onStreamOffline:', err)
      }

      this.streamsEnded.delete(channelEntity.channelId)
      channelEntity.updateStream({ endedAt })
      await this.dbChannelsService.write()
    }

    const interval = setTimeout(editMessage, 30 * 1000)

    this.streamsEnded.set(channelEntity.channelId, {
      endedAt,
      dispose: () => clearTimeout(interval)
    })
  }
}
