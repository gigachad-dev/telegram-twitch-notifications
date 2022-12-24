import 'reflect-metadata'
import { Bot } from 'grammy'
import { config } from './config.js'
import { database } from './database.js'
import { checkBotOwner } from './middleware.js'
import { Server } from './server.js'
import { AuthProvider, TwitchApiClient } from './twitch/index.js'

await database.initialize()
await database.runMigrations()

const bot = new Bot(config.BOT_TOKEN)
const auth = await new AuthProvider().initialize()
const api = new TwitchApiClient(auth)
const server = new Server()

bot.use(checkBotOwner)

bot.command('subscribe', (ctx) => {
  console.log(ctx.message)
})

bot.command('unsubscribe', (ctx) => {
  console.log(ctx.message)
})

bot.command('channels', (ctx) => {
  console.log(ctx.message)
})

bot.start()
bot.catch(console.log)
