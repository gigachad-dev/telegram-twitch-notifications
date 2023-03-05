import { AsyncAdapter } from '@stenodb/node'
import { singleton } from 'tsyringe'
import { Channels } from '../entities/index.js'
import { Watcher } from '../entities/watcher.js'
import { DatabaseProvider } from './database.provider.js'
import type { AsyncProvider } from '@stenodb/node'

@singleton()
export class DatabaseChannelsService {
  private db: AsyncProvider<Channels>

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async init(): Promise<void> {
    const adapter = new AsyncAdapter('channels', Channels, new Channels())
    this.db = await this.databaseProvider.create(adapter)
    await this.db.read()
  }

  get data() {
    return this.db.data
  }

  async write() {
    await this.db.write()
  }
}
