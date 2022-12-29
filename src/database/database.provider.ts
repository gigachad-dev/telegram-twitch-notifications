import { singleton } from 'tsyringe'
import { DataSource } from 'typeorm'
import { ConfigService } from '../config/config.service.js'
import * as entities from '../entities/index.js'

@singleton()
export class DatabaseProvider extends DataSource {
  constructor(private readonly configService: ConfigService) {
    super({
      ...configService.databaseConfig,
      type: 'postgres',
      host: configService.isDev ? 'localhost' : 'postgres',
      entities: Object.values(entities),
      migrations: [
        configService.isDev ? 'src/migrations/*.ts' : 'dist/migrations/*.js'
      ]
    })
  }
}
