import { AsyncAdapter } from '@stenodb/node'
import { singleton } from 'tsyringe'
import { Watchers } from '../entities/watchers.js'
import { DatabaseProvider } from './database.provider.js'
import type { AsyncProvider } from '@stenodb/node'

@singleton()
export class DatabaseWatchersService {
  private db: AsyncProvider<Watchers>

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async init(): Promise<void> {
    const adapter = new AsyncAdapter('watchers', Watchers, new Watchers())
    this.db = await this.databaseProvider.create(adapter)
    await this.db.read()
  }

  get data() {
    return this.db.data!.watchers
  }

  findWatchers(chatId: number) {
    return this.data.find((watcher) => watcher.chatId === chatId)
  }

  async write() {
    await this.db.write()
  }
}
