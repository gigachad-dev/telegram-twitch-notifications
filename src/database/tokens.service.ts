import { injectable, singleton } from 'tsyringe'
import { DatabaseProvider } from './database.provider.js'
import type { Tokens } from '../entities/tokens.js'
import type { Low } from 'lowdb'

@singleton()
export class DatabaseTokensService {
  private readonly db: Low<Tokens>

  constructor(private readonly database: DatabaseProvider) {
    this.db = this.database.createDatabase<Tokens>('tokens.json')
    this.init()
  }

  private async init() {
    await this.db.read()
    this.db.data ||= {} as Tokens
    await this.db.write()
  }

  async getTokens() {
    return this.db.data
  }

  async writeTokens(tokens: Tokens) {
    this.db.data = tokens
    await this.db.write()
  }
}
