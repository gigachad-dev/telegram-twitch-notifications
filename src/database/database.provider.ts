import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { NodeProvider } from 'stenodb/node'
import { singleton } from 'tsyringe'
import { ConfigService } from '../config/config.service.js'

const lowdbPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'db'
)

@singleton()
export class DatabaseProvider extends NodeProvider {
  constructor(private readonly configService: ConfigService) {
    super({
      path: lowdbPath,
      logger: { enabled: false }
    })
  }
}
