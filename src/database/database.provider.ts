import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { singleton } from 'tsyringe'

const lowdbPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'db'
)

@singleton()
export class DatabaseProvider {
  createDatabase<T extends unknown>(filename: string): Low<T> {
    const file = join(lowdbPath, filename)
    const adapter = new JSONFile<T>(file)
    return new Low<T>(adapter)
  }
}
