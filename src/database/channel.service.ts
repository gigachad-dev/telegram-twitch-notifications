import { LowDatabase } from '@crashmax/lowdb'
import { singleton } from 'tsyringe'
import { Channel, Stream } from '../entities/index.js'
import { DatabaseProvider } from './database.provider.js'

@singleton()
export class DatabaseChannelsService {
  private db: LowDatabase<Channel[]>

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async init() {
    this.db = await this.databaseProvider.createDatabase<Channel[]>(
      'channels',
      []
    )
  }

  get channels() {
    return this.db.data
  }

  getChannel(channelId: string) {
    return this.db.data?.find((channel) => channel.channelId === channelId)
  }

  async deleteChannel(channelId: string) {
    this.db.data = this.db.data!.filter(
      (channel) => channel.channelId !== channelId
    )
    await this.db.write()
  }

  async addChannel(channel: Channel) {
    this.db.data?.push(channel)
    await this.db.write()
  }

  async addStream(channel: Channel, stream: Stream) {
    channel.stream = stream
    await this.db.write()
  }

  async deleteStream(channel: Channel) {
    channel.stream = null
    await this.db.write()
  }
}
