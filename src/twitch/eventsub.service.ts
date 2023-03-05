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
} from '@twurple/eventsub-base'
import type { GrammyError } from 'grammy'

interface ChannelEvents {
  onlineEvent: EventSubSubscription
  offlineEvent: EventSubSubscription
  updateEvent: EventSubSubscription
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
    this.eventsub = new EventSubMiddleware({
      apiClient: this.apiService.apiClient,
      hostName: await NgrokHostname(this.configService),
      pathPrefix: '/twitch',
      strictHostCheck: true,
      secret: this.configService.twitchTokens.clientSecret,
      legacySecrets: true
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
        { parse_mode: 'Markdown', caption: photoDescription }
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

    const channelEntity = this.dbChannelsService.data!.getChannelById(
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
        { parse_mode: 'Markdown', caption: photoDescription }
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
        parse_mode: 'Markdown',
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
    const channelEntity = this.dbChannelsService.data!.getChannelById(
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
        { parse_mode: 'Markdown', caption: photoDescription }
      )
    } catch (err) {
      console.log('onStreamOffline:', err)
    }

    channelEntity.updateStream({ endedAt })
    await this.dbChannelsService.write()
  }
}
