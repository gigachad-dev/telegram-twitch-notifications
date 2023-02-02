import { Bot } from 'grammy'
import { singleton } from 'tsyringe'
import { ConfigService } from '../config/config.service.js'
import { DatabaseChannelsService } from '../database/channels.service.js'
import { EventSubService } from '../twitch/eventsub.service.js'

@singleton()
export class TelegramService extends Bot {
  constructor(
    private readonly configService: ConfigService,
    private readonly dbChannelService: DatabaseChannelsService
  ) {
    super(configService.telegramTokens.botToken)
  }

  async initialize(eventsub: EventSubService): Promise<void> {
    this.start({
      allowed_updates: ['message', 'callback_query'],
      onStart: async () => {
        for (const channel of this.dbChannelService.data!.channels) {
          await eventsub.subscribeEvent(channel.channelId)
        }
      }
    })

    this.catch(console.log)
  }
}
