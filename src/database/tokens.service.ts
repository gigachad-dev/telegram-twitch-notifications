import { injectable, singleton } from 'tsyringe'
import { DatabaseProvider } from './database.provider.js'
import type { Tokens } from '../entities/tokens.js'
import type { Low } from 'lowdb'

@singleton()
export class DatabaseTokensService {
  private readonly tokens: Low<Tokens>

  constructor(private readonly database: DatabaseProvider) {
    this.tokens = this.database.createDatabase<Tokens>('tokens.json')
    this.init()
  }

  private async init() {
    await this.tokens.read()
    this.tokens.data ||= {} as Tokens
    await this.tokens.write()
  }

  async getTokens() {
    return this.tokens.data
  }

  async writeTokens(tokens: Tokens) {
    this.tokens.data = tokens
    await this.tokens.write()
  }
}
