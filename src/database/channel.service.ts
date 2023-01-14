import { singleton } from 'tsyringe'
import { Channel, Stream } from '../entities/index.js'
import { DatabaseProvider } from './database.provider.js'
import type { Low } from 'lowdb'

@singleton()
export class DatabaseChannelsService {
  private readonly db: Low<Channel[]>

  constructor(private readonly database: DatabaseProvider) {
    this.db = this.database.createDatabase<Channel[]>('channels.json')
    this.init()
  }

  private async init() {
    await this.db.read()
    this.db.data ||= []
    await this.db.write()
  }

  get channels() {
    return this.db.data
  }

  getChannel(channelId: string) {
    return this.db.data?.find((channel) => channel.channelId === channelId)
  }

  async deleteChannel(channelId: string) {
    this.db.data = this.db.data!.filter((channel) => channel.channelId !== channelId)
    await this.db.write()
  }

  async addChannel({ channelId, topicId }: Omit<Channel, 'stream'>) {
    this.db.data?.push(new Channel(channelId, topicId))
    await this.db.write()
  }

  async addStream(channel: Channel, { title, game, messageId }: Stream) {
    channel.stream = new Stream(title, game, messageId)
    await this.db.write()
  }

  async deleteStream(channel: Channel) {
    channel.stream = null
    await this.db.write()
  }
}
