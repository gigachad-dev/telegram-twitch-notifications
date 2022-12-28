import 'dotenv/config'
import { DataSource } from 'typeorm'
import * as entities from '../entities/index.js'

const migrationsPath =
  process.env['NODE_ENV'] === 'development'
    ? 'src/migrations/*.ts'
    : 'dist/migrations/*.js'

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env['DATABASE_URL'],
  entities: Object.values(entities),
  migrations: [migrationsPath]
})

await dataSource.initialize()
