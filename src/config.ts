import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { cleanEnv, num, str } from 'envalid'

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', '.env')
dotenv.config({ path: envPath })

export const config = cleanEnv(process.env, {
  BOT_TOKEN: str(),
  BOT_OWNER_ID: num(),
  CHAT_ID: str(),
  CLIENT_ID: str(),
  CLIENT_SECRET: str(),
  ACCESS_TOKEN: str(),
  REFRESH_TOKEN: str(),
  HOSTNAME: str(),
  PORT: num()
})
