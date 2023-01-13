import Ngrok from 'ngrok'
import type { ConfigService } from './config/config.service'

export async function NgrokHostname(
  configService: ConfigService
): Promise<string> {
  const { hostname, port } = configService.serverConfig

  if (configService.isDev) {
    await Ngrok.disconnect()
    const tunnel = await Ngrok.connect(port)
    return tunnel.replace('https://', '')
  }

  return hostname.replace('https://', '')
}
