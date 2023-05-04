import dotenv from 'dotenv'
import { cleanEnv, num, str } from 'envalid'
import { singleton } from 'tsyringe'
import { envPath } from './config.service.js'

interface Environments {
  BOT_TOKEN: string
  BOT_OWNER_ID: number
  CHAT_ID: number
  CLIENT_ID: string
  CLIENT_SECRET: string
  ACCESS_TOKEN: string
  REFRESH_TOKEN: string
  EXPRESS_HOSTNAME: string
  EXPRESS_PORT: number
}

@singleton()
export class ConfigProvider {
  public readonly config: Environments

  constructor() {
    dotenv.config({ path: envPath })

    this.config = cleanEnv<Environments>(process.env, {
      BOT_TOKEN: str(),
      BOT_OWNER_ID: num(),
      CHAT_ID: num(),
      CLIENT_ID: str(),
      CLIENT_SECRET: str(),
      ACCESS_TOKEN: str(),
      REFRESH_TOKEN: str(),
      EXPRESS_HOSTNAME: str({ default: 'localhost' }),
      EXPRESS_PORT: num({ default: 3003 })
    })
  }
}
