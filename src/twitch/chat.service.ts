import { ChatClient } from '@twurple/chat'
import { singleton } from 'tsyringe'
import { DatabaseChannelsService } from '../database/channels.service.js'
import { DatabaseWatchersService } from '../database/watchers.service.js'
import { TelegramCommands } from '../telegram/telegram.commands.js'
import { AuthService } from './auth.service.js'
import type { PrivateMessage } from '@twurple/chat'

@singleton()
export class ChatService {
  private chatClient: ChatClient

  constructor(
    private readonly authService: AuthService,
    private readonly telegramCommands: TelegramCommands,
    private readonly channelsService: DatabaseChannelsService,
    private readonly watchersService: DatabaseWatchersService
  ) {}

  async init(): Promise<void> {
    const channels = this.channelsService.data!.channels.map(
      (channel) => channel.displayName
    )

    this.chatClient = new ChatClient({
      authProvider: this.authService.provider,
      authIntents: ['chat'],
      channels
    })

    await this.chatClient.connect()
    await this.telegramCommands.init(this.chatClient)

    this.chatClient.onAuthenticationFailure(([text, retryCount]) => {
      console.log('Auth failed', { text, retryCount })
    })

    this.chatClient.onMessage(this.onMessage.bind(this))
  }

  private onMessage(
    channel: string,
    sender: string,
    text: string,
    msg: PrivateMessage
  ): void {
    for (const watcher of this.watchersService.data) {
      const isIgnoredUser = watcher.ignored_users.find((match) =>
        match.includes(sender)
      )
      if (isIgnoredUser) continue

      const isAllowedWord = watcher.allowed_words.find(
        (match) => text.toLowerCase().indexOf(match) !== -1
      )
      if (isAllowedWord) {
        this.telegramCommands.sendMessageFromTwitch(
          channel.slice(1),
          sender,
          watcher.chatId,
          text
        )
      }
    }
  }
}
