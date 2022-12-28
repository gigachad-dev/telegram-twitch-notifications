import 'reflect-metadata'
import { autoInjectable, container } from 'tsyringe'
import { ConfigService } from './config/config.service.js'
import { DatabaseService } from './database/database.service.js'
import { TelegramCommands } from './telegram/telegram.commands.js'
import { ApiService } from './twitch/api.service.js'
import { AuthService } from './twitch/auth.service.js'
import { EventSubService } from './twitch/eventsub.service.js'

@autoInjectable()
class App {
  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly authService: AuthService,
    private readonly apiService: ApiService,
    private readonly eventSubService: EventSubService,
    private readonly telegramCommands: TelegramCommands
  ) {}

  async initialize(): Promise<void> {
    await this.databaseService.init()
    await this.authService.init()
    await this.apiService.init()
    await this.eventSubService.init()
    await this.telegramCommands.init()

    if (!this.configService.isDev) {
      const { hostname, port } = this.configService.serverConfig
      console.log(`Started ${hostname} with ${port} port`)
    }
  }
}

await container.resolve(App).initialize()
