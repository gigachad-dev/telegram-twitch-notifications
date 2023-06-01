import 'reflect-metadata'
import { Bot } from 'grammy'
import { env } from './config/env.js'
import { databaseTokens } from './database/index.js'
import { ChannelsCommand } from './telegram/commands/channels.js'
import { DeleteMessageCommand } from './telegram/commands/delete-message.js'
import { StreamsCommmand } from './telegram/commands/streams.js'
import { WatchersCommand } from './telegram/commands/watchers.js'
import { TelegramCommands } from './telegram/telegram.commands.js'
import { TelegramMiddleware } from './telegram/telegram.middleware.js'
import { ApiService } from './twitch/api.service.js'
import { AuthService } from './twitch/auth.service.js'
import { ChatService } from './twitch/chat.service.js'
import { EventSubService } from './twitch/eventsub.service.js'

const bot = new Bot(env.BOT_TOKEN)

const authService = new AuthService(databaseTokens)
await authService.init()

const apiService = new ApiService(authService)
const eventSubService = new EventSubService(apiService, bot)
await eventSubService.init()

const botMiddleware = new TelegramMiddleware()
const deleteMessageCommand = new DeleteMessageCommand(bot, botMiddleware)
const channelsCommand = new ChannelsCommand(
  bot,
  apiService,
  eventSubService,
  botMiddleware
)
const streamsCommand = new StreamsCommmand(bot, apiService, botMiddleware)
const watchersCommand = new WatchersCommand(bot, apiService, botMiddleware)
const botCommands = new TelegramCommands(
  bot,
  deleteMessageCommand,
  channelsCommand,
  streamsCommand,
  watchersCommand
)

const chatService = new ChatService(authService, botCommands)
await chatService.init()

bot.start({
  allowed_updates: ['message', 'callback_query'],
  onStart() {
    console.log('Bot started!')
  }
})
