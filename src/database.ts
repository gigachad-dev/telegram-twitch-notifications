import { DataSource } from 'typeorm'
import { config } from './config.js'
import * as entities from './entities/index.js'

export const database = new DataSource({
  type: 'postgres',
  url: config.DATABASE_URL,
  entities: Object.values(entities),
  migrations: [config.isDev ? 'src/migrations/*.ts' : 'dist/migrations/*.js']
})
