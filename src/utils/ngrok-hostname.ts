import Ngrok from 'ngrok'
import { env } from '../config/env.js'

export async function getNgrokHostname(): Promise<string> {
  if (env.isDev) {
    await Ngrok.disconnect()
    const tunnel = await Ngrok.connect(env.SERVER_PORT)
    return tunnel.replace('https://', '')
  }

  return env.SERVER_HOSTNAME.replace('https://', '')
}
