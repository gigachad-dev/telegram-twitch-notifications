import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { cleanEnv, num, str } from 'envalid'
import { singleton } from 'tsyringe'

interface Environments {
  DATABASE_URL: string
  BOT_TOKEN: string
  BOT_OWNER_ID: number
  CHAT_ID: string
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
    const envPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      '..',
      '..',
      '.env'
    )
    dotenv.config({ path: envPath })

    this.config = cleanEnv<Environments>(process.env, {
      DATABASE_URL: str({
        default: 'postgresql://tg:tg@localhost:5432/tg?schema=public'
      }),
      BOT_TOKEN: str(),
      BOT_OWNER_ID: num(),
      CHAT_ID: str(),
      CLIENT_ID: str(),
      CLIENT_SECRET: str(),
      ACCESS_TOKEN: str(),
      REFRESH_TOKEN: str(),
      EXPRESS_HOSTNAME: str({ default: 'localhost' }),
      EXPRESS_PORT: num({ default: 3003 })
    })
  }
}
