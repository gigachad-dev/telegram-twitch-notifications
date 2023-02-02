import 'reflect-metadata'
import { autoInjectable, container } from 'tsyringe'
import { ConfigService } from './config/config.service.js'
import { DatabaseChannelsService } from './database/channels.service.js'
import { DatabaseTokensService } from './database/tokens.service.js'
import { ExpressService } from './express/express.service.js'
import { ApiService } from './twitch/api.service.js'
import { AuthService } from './twitch/auth.service.js'
import { EventSubService } from './twitch/eventsub.service.js'

@autoInjectable()
class App {
  constructor(
    private readonly configService: ConfigService,
    private readonly tokensService: DatabaseTokensService,
    private readonly channelsService: DatabaseChannelsService,
    private readonly authService: AuthService,
    private readonly apiService: ApiService,
    private readonly eventSubService: EventSubService,
    private readonly expressService: ExpressService
  ) {}

  async initialize(): Promise<void> {
    await this.tokensService.init()
    await this.channelsService.init()
    await this.authService.init()
    await this.apiService.init()
    await this.eventSubService.init()
    await this.expressService.init()

    if (!this.configService.isDev) {
      const { hostname, port } = this.configService.serverConfig
      console.log(`Started ${hostname} with ${port} port`)
    }
  }
}

await container.resolve(App).initialize()
