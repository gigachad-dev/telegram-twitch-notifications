import { ChatClient, toUserName } from '@twurple/chat'
import { databaseChannels, databaseWatchers } from '../database/index.js'
import { TelegramCommands } from '../telegram/telegram.commands.js'
import { AuthService } from './auth.service.js'
import type { ChatMessage } from '@twurple/chat'

export class ChatService {
  private chatClient: ChatClient

  constructor(
    private readonly authService: AuthService,
    private readonly telegramCommands: TelegramCommands
  ) {}

  async init(): Promise<void> {
    const channels = databaseChannels.data!.channels.map(
      (channel) => channel.displayName
    )

    this.chatClient = new ChatClient({
      authProvider: this.authService.provider,
      authIntents: ['chat'],
      channels
    })

    this.chatClient.connect()
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
    _msg: ChatMessage
  ): void {
    for (const watcher of databaseWatchers.data) {
      const isIgnoredUser = watcher.ignored_users.find((match) =>
        match.includes(sender)
      )
      if (isIgnoredUser) continue

      const isAllowedWord = watcher.allowed_words.find(
        (match) => text.toLowerCase().indexOf(match) !== -1
      )
      if (isAllowedWord) {
        this.telegramCommands.sendMessageFromTwitch(
          toUserName(channel),
          sender,
          watcher.chatId,
          text
        )
      }
    }
  }
}
