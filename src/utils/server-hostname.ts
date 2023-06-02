import { env } from '../config/env.js'

export function getServerHostname(): string {
  if (env.isDev) {
    return process.env['NGROK_URL']!.replace('https://', '')
  }

  return env.SERVER_HOSTNAME.replace('https://', '')
}
