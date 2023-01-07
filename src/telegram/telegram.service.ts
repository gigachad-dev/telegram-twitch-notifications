import { Bot } from 'grammy'
import { singleton } from 'tsyringe'
import { ConfigService } from '../config/config.service.js'
import { DatabaseService } from '../database/database.service.js'
import { EventSubService } from '../twitch/eventsub.service.js'

@singleton()
export class TelegramService extends Bot {
  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService
  ) {
    super(configService.telegramTokens.botToken)
  }

  async initialize(eventsub: EventSubService): Promise<void> {
    this.start({
      allowed_updates: ['message'],
      onStart: async () => {
        const channels = await this.databaseService.getStreams()
        for (const channel of channels) {
          await eventsub.subscribeEvent(channel.id)
        }
      }
    })

    this.catch(console.log)
  }
}
