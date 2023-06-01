import { AsyncAdapter } from '@stenodb/node'
import { DatabaseProvider } from '../database-provider.js'
import { Tokens } from './tokens.schema.js'
import type { AsyncProvider } from '@stenodb/node'

export class DatabaseTokens {
  private tokens: AsyncProvider<Tokens>

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async init(): Promise<void> {
    const adapter = new AsyncAdapter('tokens', Tokens)
    this.tokens = await this.databaseProvider.create(adapter)
    await this.tokens.read()
  }

  get data() {
    return this.tokens.data
  }

  async write(tokens: Tokens) {
    this.tokens.data! = tokens
    await this.tokens.write()
  }
}
