import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DataSource } from 'typeorm'
import * as entities from './entities/index.js'

const databasePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'db.sqlite'
)

export const database = new DataSource({
  type: 'sqlite',
  database: databasePath,
  entities: Object.values(entities),
  migrations: ['src/migrations/*.ts']
})
