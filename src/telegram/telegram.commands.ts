import { streamsMessage } from '../utils/messages.js'
import { ChannelsCommand } from './commands/channels.js'
import { DeleteMessageCommand } from './commands/delete-message.js'
import { StreamsCommmand } from './commands/streams.js'
import { WatchersCommand } from './commands/watchers.js'
import type { ChatClient } from '@twurple/chat'
import type { Bot, Context } from 'grammy'

export class TelegramCommands {
  constructor(
    private readonly bot: Bot<Context>,
    private readonly deleteMessageCommand: DeleteMessageCommand,
    private readonly channelsCommand: ChannelsCommand,
    private readonly streamsCommand: StreamsCommmand,
    private readonly watchersCommand: WatchersCommand
  ) {}

  async init(chatClient: ChatClient): Promise<void> {
    this.deleteMessageCommand.init()
    this.channelsCommand.init(chatClient)
    this.streamsCommand.init()
    this.watchersCommand.init()

    await this.bot.api.setMyCommands([
      {
        command: 'delete',
        description: 'Ответьте на сообщение, чтобы удалить его.'
      },
      {
        command: 'streams',
        description: 'Получить список каналов в сети.'
      },
      {
        command: 'channels',
        description: 'Получить список каналов.'
      }
    ])
  }

  async sendMessageFromTwitch(
    channel: string,
    sender: string,
    chatId: number,
    message: string
  ): Promise<void> {
    try {
      await this.bot.api.sendMessage(
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
