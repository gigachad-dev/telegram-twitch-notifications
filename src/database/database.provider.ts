import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LowProvider } from '@crashmax/lowdb'
import { singleton } from 'tsyringe'

const lowdbPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'db'
)

@singleton()
export class DatabaseProvider extends LowProvider {
  constructor() {
    super(lowdbPath)
  }
}
