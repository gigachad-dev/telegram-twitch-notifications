import { LowDatabase } from '@crashmax/lowdb'
import { singleton } from 'tsyringe'
import { DatabaseProvider } from './database.provider.js'
import type { Tokens } from '../entities/tokens.js'

@singleton()
export class DatabaseTokensService {
  private db: LowDatabase<Tokens>

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async init() {
    this.db = await this.databaseProvider.createDatabase<Tokens>('tokens')
  }

  get tokens() {
    return this.db.data
  }

  async writeTokens(tokens: Tokens) {
    await this.db.writeData(tokens)
  }
}
