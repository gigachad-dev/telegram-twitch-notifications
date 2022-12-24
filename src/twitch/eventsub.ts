import { ApiClient, HelixStream } from '@twurple/api'
import { ClientCredentialsAuthProvider } from '@twurple/auth'
import { EventSubMiddleware } from '@twurple/eventsub'
import dedent from 'dedent'
import Ngrok from 'ngrok'
import { config } from '../config.js'
import { database } from '../database.js'
import { Channel, Stream } from '../entities/index.js'
import type {
  EventSubStreamOfflineEvent,
  EventSubStreamOnlineEvent,
  EventSubSubscription
} from '@twurple/eventsub'
import type { Api, Bot, Context, RawApi } from 'grammy'
import type { Repository } from 'typeorm'

interface ChannelEvents {
  onlineEvent: EventSubSubscription<unknown>
  offlineEvent: EventSubSubscription<unknown>
}

export class EventSub {
  private eventsub: EventSubMiddleware
  private readonly events = new Map<string, ChannelEvents>()
  private readonly streamRepository = database.getRepository(Stream)

  constructor(
    private readonly bot: Bot<Context, Api<RawApi>>,
    private readonly channelRepository: Repository<Channel>
  ) {}

  async initialize() {
    const authProvider = new ClientCredentialsAuthProvider(
      config.CLIENT_ID,
      config.CLIENT_SECRET
    )

    const apiClient = new ApiClient({ authProvider })

    this.eventsub = new EventSubMiddleware({
      apiClient,
      hostName: await this.getHostName(),
      pathPrefix: '/twitch',
      strictHostCheck: true,
      secret: config.CLIENT_SECRET
    })
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

  private async onStreamOnline(event: EventSubStreamOnlineEvent) {
    const streamInfo = await event.getStream()
    const channelEntity = await this.channelRepository.findOneBy({
      channelId: streamInfo.id
    })

    this.sendMessage(streamInfo, channelEntity)
  }

  async sendMessage(streamInfo: HelixStream, channelEntity: Channel) {
    const streamThumbnailUrl = streamInfo.getThumbnailUrl(1920, 1080)
    const photoDescription = this.generateDescription({
      game: streamInfo.gameName,
      title: streamInfo.title,
      username: streamInfo.userName,
      ended: false
    })

    const sendedMessage = await this.bot.api.sendPhoto(
      config.CHAT_ID,
      streamThumbnailUrl,
      {
        caption: photoDescription,
        message_thread_id: channelEntity.topicId
      }
    )

    // TODO: upsert stream
  }

  private async onStreamOffline(event: EventSubStreamOfflineEvent) {
    const channelInfo = await event.getBroadcaster()
    const channelEntity = await this.channelRepository.findOneBy({
      channelId: channelInfo.id
    })

    const photoDescription = this.generateDescription({
      game: channelEntity.stream.game,
      title: channelEntity.stream.title,
      username: channelEntity.displayName,
      ended: true
    })

    await this.bot.api.editMessageCaption(
      config.CHAT_ID,
      channelEntity.stream.messageId,
      {
        caption: photoDescription
      }
    )

    await this.streamRepository.delete({
      channelId: channelEntity.channelId
    })
  }

  private generateDescription({
    title,
    game,
    username,
    ended
  }: {
    title: string
    game: string
    username: string
    ended: boolean
  }) {
    return dedent`
      ${ended ? '🔴' : '🟢'} ${title} — ${game}
      https://twitch.tv/${username}
    `
  }

  async unsubscribeEvent(channelId: string): Promise<void> {
    if (!this.events.has(channelId)) return
    const events = this.events.get(channelId)
    await events.onlineEvent.stop()
    await events.offlineEvent.stop()
    this.events.delete(channelId)
  }

  get middleware() {
    return this.eventsub
  }

  private async getHostName() {
    let hostName = ''

    if (config.isDev) {
      await Ngrok.disconnect()
      const tunnel = await Ngrok.connect(3003)
      hostName = tunnel.replace('https://', '')
    } else {
      hostName = `eventsub.${config.HOSTNAME.replace('https://', '')}`
    }

    return hostName
  }
}
