import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { injectable } from 'tsyringe'
import { ConfigProvider } from './config.provider.js'

export const envPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '.env'
)

export const thumbnailsPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'thumbnails'
)

@injectable()
export class ConfigService {
  constructor(private readonly configProvider: ConfigProvider) {}

  get isDev(): boolean {
    return process.env['NODE_ENV'] === 'development'
  }

  get twitchTokens() {
    return {
      clientId: this.configProvider.config.CLIENT_ID,
      clientSecret: this.configProvider.config.CLIENT_SECRET,
      accessToken: this.configProvider.config.ACCESS_TOKEN,
      refreshToken: this.configProvider.config.REFRESH_TOKEN
    }
  }

  get telegramTokens() {
    return {
      chatId: this.configProvider.config.CHAT_ID,
      botOwnerId: this.configProvider.config.BOT_OWNER_ID,
      botToken: this.configProvider.config.BOT_TOKEN
    }
  }

  get serverConfig() {
    return {
      hostname: this.configProvider.config.EXPRESS_HOSTNAME,
      port: this.configProvider.config.EXPRESS_PORT
    }
  }
}
