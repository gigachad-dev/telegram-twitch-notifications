import { singleton } from 'tsyringe'
import { DatabaseChannelsService } from '../database/channel.service.js'
import { DatabaseTokensService } from '../database/tokens.service.js'

@singleton()
export class EntitiesProvider {
  constructor(
    private readonly channels: DatabaseChannelsService,
    private readonly tokens: DatabaseTokensService
  ) {}

  async init(): Promise<void> {
    await this.tokens.init()
    await this.channels.init()
  }
}
