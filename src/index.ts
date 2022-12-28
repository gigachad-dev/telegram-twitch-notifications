import 'reflect-metadata'
import { autoInjectable, container } from 'tsyringe'
import { ConfigService } from './config/config.service.js'
import { DatabaseService } from './database/database.service.js'
import { TelegramCommands } from './telegram/telegram.commands.js'
import { AuthService } from './twitch/auth.service.js'
import { EventSubService } from './twitch/eventsub.service.js'

@autoInjectable()
class App {
  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly authService: AuthService,
    private readonly eventSubService: EventSubService,
    private readonly telegramCommands: TelegramCommands
  ) {}

  async initialize(): Promise<void> {
    await this.databaseService.init()
    console.log('Init databaseService')

    await this.authService.init()
    console.log('Init authService')

    await this.eventSubService.init()
    console.log('Init eventSubService')

    await this.telegramCommands.init()
    console.log('Init telegramCommands')

    const { hostname, port } = this.configService.serverConfig
    console.log(`Started ${hostname} with ${port} port`)
  }
}

await container.resolve(App).initialize()
