import { singleton } from 'tsyringe'
import { DatabaseChannelsService } from './channels.service.js'
import { DatabaseTokensService } from './tokens.service.js'
import { DatabaseWatchersService } from './watcher.service.js'

@singleton()
export class DatabaseService {
  constructor(
    private readonly dbChannelsService: DatabaseChannelsService,
    private readonly dbTokensService: DatabaseTokensService,
    private readonly dbWatchersService: DatabaseWatchersService
  ) {}

  async init() {
    await this.dbChannelsService.init()
    await this.dbTokensService.init()
    await this.dbWatchersService.init()
  }
}
