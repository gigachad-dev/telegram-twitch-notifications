import 'dotenv/config'
import { cleanEnv, num, str } from 'envalid'

export const config = cleanEnv(process.env, {
  BOT_TOKEN: str(),
  BOT_OWNER_ID: num(),
  CLIENT_ID: str(),
  CLIENT_SECRET: str(),
  ACCESS_TOKEN: str(),
  REFRESH_TOKEN: str(),
  HOSTNAME: str()
})
