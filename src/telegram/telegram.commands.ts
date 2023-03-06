import { singleton } from 'tsyringe'
import { EventSubService } from '../twitch/eventsub.service.js'
import { streamsMessage } from '../utils/messages.js'
import { ChannelsCommand } from './commands/channels.js'
import { StreamsCommmand } from './commands/streams.js'
import { WatchersCommand } from './commands/watchers.js'
import { TelegramService } from './telegram.service.js'
import type { ChatClient } from '@twurple/chat'

@singleton()
export class TelegramCommands {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly eventSubService: EventSubService,
    private readonly channelsCommand: ChannelsCommand,
    private readonly streamsCommand: StreamsCommmand,
    private readonly watchersCommand: WatchersCommand
  ) {}

  async init(chatClient: ChatClient): Promise<void> {
    this.channelsCommand.init(chatClient)
    this.streamsCommand.init()
    this.watchersCommand.init()

    await this.telegramService.api.setMyCommands([
      {
        command: 'streams',
        description: 'Получить список стримеров в сети.'
      },
      {
        command: 'channels',
        description: 'Получить список каналов.'
      },
      {
        command: 'watchers',
        description: 'Получить список наблюдателей.'
      }
    ])

    await this.telegramService.initialize(this.eventSubService)
  }

  async sendMessageFromTwitch(
    channel: string,
    sender: string,
    chatId: number,
    message: string
  ): Promise<void> {
    try {
      await this.telegramService.api.sendMessage(
        chatId,
        streamsMessage({
          channel,
          sender,
          message
        }),
        {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        }
      )
    } catch (err) {
      console.log(err)
    }
  }
}
