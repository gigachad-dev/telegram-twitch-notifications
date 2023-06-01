import { AsyncAdapter } from '@stenodb/node'
import { DatabaseProvider } from '../database-provider.js'
import { Channels } from './channels.schema.js'
import type { AsyncProvider } from '@stenodb/node'

export class DatabaseChannels {
  private channels: AsyncProvider<Channels>

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async init(): Promise<void> {
    const adapter = new AsyncAdapter('channels', Channels, new Channels())
    this.channels = await this.databaseProvider.create(adapter)
    await this.channels.read()
  }

  get data() {
    return this.channels.data
  }

  async write() {
    await this.channels.write()
  }
}
