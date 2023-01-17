import { LowDatabase } from '@crashmax/lowdb'
import { singleton } from 'tsyringe'
import { Tokens } from '../entities/tokens.js'
import { DatabaseProvider } from './database.provider.js'

@singleton()
export class DatabaseTokensService {
  private db: LowDatabase<Tokens>

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async init() {
    this.db = await this.databaseProvider.createDatabase<Tokens>('tokens')
  }

  get tokens() {
    const tokens = this.db.data
    return tokens ? new Tokens(tokens) : null
  }

  async writeTokens(tokens: Tokens) {
    await this.db.writeData(tokens)
  }
}
