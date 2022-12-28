import 'reflect-metadata'
import { container } from 'tsyringe'
import { DatabaseService } from './database/database.service.js'
import { TelegramCommands } from './telegram/telegram.commands.js'
import { AuthService } from './twitch/auth.service.js'
import { EventSubService } from './twitch/eventsub.service.js'

const database = container.resolve(DatabaseService)
await database.initialize()

const auth = container.resolve(AuthService)
await auth.initialize()

const eventsub = container.resolve(EventSubService)
await eventsub.initialize()

const commands = container.resolve(TelegramCommands)
await commands.initialize()
