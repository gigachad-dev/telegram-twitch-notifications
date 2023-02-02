import { singleton } from 'tsyringe'
import { Channels } from '../entities/index.js'
import { DatabaseProvider } from './database.provider.js'
import type { NodeAdapter } from 'stenodb'

@singleton()
export class DatabaseChannelsService {
  private readonly db: NodeAdapter<Channels>

  constructor(private readonly databaseProvider: DatabaseProvider) {
    this.db = this.databaseProvider.createDatabase({
      name: 'channels',
      entity: Channels,
      initialData: new Channels()
    })
  }

  get data() {
    return this.db.data
  }

  write() {
    this.db.write()
  }
}
