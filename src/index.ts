import 'reflect-metadata'
import { autoInjectable, container } from 'tsyringe'
import { ConfigService } from './config/config.service.js'
import { DatabaseService } from './database/database.service.js'
import { ExpressService } from './express/express.service.js'
import { ApiService } from './twitch/api.service.js'
import { AuthService } from './twitch/auth.service.js'
import { ChatService } from './twitch/chat.service.js'
import { EventSubService } from './twitch/eventsub.service.js'

@autoInjectable()
class App {
  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly authService: AuthService,
    private readonly apiService: ApiService,
    private readonly eventSubService: EventSubService,
    private readonly chatService: ChatService,
    private readonly expressService: ExpressService
  ) {}

  async initialize(): Promise<void> {
    await this.databaseService.init()
    await this.authService.init()
    await this.apiService.init()
    await this.expressService.init()
    await this.chatService.init()

    if (!this.configService.isDev) {
      const { hostname, port } = this.configService.serverConfig
      console.log(`Started ${hostname} with ${port} port`)
    }
  }
}

await container.resolve(App).initialize()
