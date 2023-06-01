import { AsyncAdapter } from '@stenodb/node'
import { DatabaseProvider } from '../database-provider.js'
import { Watchers } from './watchers.schema.js'
import type { AsyncProvider } from '@stenodb/node'

export class DatabaseWatchers {
  private watchers: AsyncProvider<Watchers>

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async init(): Promise<void> {
    const adapter = new AsyncAdapter('watchers', Watchers, new Watchers())
    this.watchers = await this.databaseProvider.create(adapter)
    await this.watchers.read()
  }

  get data() {
    return this.watchers.data!.watchers
  }

  findWatchers(chatId: number) {
    return this.data.find((watcher) => watcher.chatId === chatId)
  }

  async write() {
    await this.watchers.write()
  }
}
