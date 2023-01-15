import { singleton } from 'tsyringe'
import { DatabaseChannelsService } from '../database/channel.service.js'
import { DatabaseTokensService } from '../database/tokens.service.js'

@singleton()
export class EntitiesProvider {
  constructor(
    private readonly channelDb: DatabaseChannelsService,
    private readonly tokensDb: DatabaseTokensService
  ) {}

  async init(): Promise<void> {
    await this.tokensDb.init()
    await this.channelDb.init()
  }
}
