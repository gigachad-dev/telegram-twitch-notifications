import 'reflect-metadata'
import { Bot } from 'grammy'
import { env } from './config/env.js'
import { databaseTokens } from './database/index.js'
import { ExpressService } from './express/server.js'
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

function telegramClientOptions() {
  const proxy = env.BOT_PROXY_URL
  if (!proxy) return

  let apiRoot = proxy.replace(/\/$/, '')
  if (apiRoot.endsWith('/bot')) {
    apiRoot = apiRoot.slice(0, -4)
  }

  return {
    apiRoot,
    fetch: globalThis.fetch.bind(globalThis),
    timeoutSeconds: 20,
    baseFetchConfig: {
      compress: false
    }
  }
}

const bot = new Bot(env.BOT_TOKEN, {
  client: telegramClientOptions()
})

const authService = new AuthService(databaseTokens)
await authService.init()

const apiService = new ApiService(authService)
const eventSubService = new EventSubService(apiService, bot)
await eventSubService.init()

const expressService = new ExpressService(eventSubService)
expressService.init()

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
  drop_pending_updates: true,
  allowed_updates: ['message', 'callback_query']
})
