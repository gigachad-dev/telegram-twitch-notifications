import { cleanEnv, num, str } from 'envalid'
import { envPath } from './paths.js'
import { config } from 'dotenv'

config({ path: envPath })

export const env = cleanEnv(process.env, {
  IMAGE_PROXY_URL: str(),
  TG_PROXY_URL: str(),
  BOT_TOKEN: str(),
  BOT_OWNER_ID: num(),
  CHAT_ID: num(),
  CLIENT_ID: str(),
  CLIENT_SECRET: str(),
  ACCESS_TOKEN: str(),
  REFRESH_TOKEN: str(),
  SERVER_HOSTNAME: str({ default: 'localhost' }),
  SERVER_PORT: num({ default: 3003 })
})
