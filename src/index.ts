import 'reflect-metadata'
import { autoInjectable, container } from 'tsyringe'
import { DatabaseService } from './database/database.service.js'
import { TelegramCommands } from './telegram/telegram.commands.js'
import { AuthService } from './twitch/auth.service.js'
import { EventSubService } from './twitch/eventsub.service.js'

@autoInjectable()
class App {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly authService: AuthService,
    private readonly eventSubService: EventSubService,
    private readonly telegramCommands: TelegramCommands
  ) {}

  async initialize(): Promise<void> {
    await this.databaseService.initialize()
    await this.authService.initialize()
    await this.eventSubService.initialize()
    await this.telegramCommands.initialize()
  }
}

await container.resolve(App).initialize()
