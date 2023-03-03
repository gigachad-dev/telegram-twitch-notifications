import { AsyncAdapter } from '@stenodb/node'
import { singleton } from 'tsyringe'
import { Tokens } from '../entities/tokens.js'
import { DatabaseProvider } from './database.provider.js'
import type { AsyncProvider } from '@stenodb/node'

@singleton()
export class DatabaseTokensService {
  private db: AsyncProvider<Tokens>

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async init(): Promise<void> {
    const adapter = new AsyncAdapter('tokens', Tokens)
    this.db = await this.databaseProvider.create(adapter)
    await this.db.read()
  }

  get data() {
    return this.db.data
  }

  async write(tokens: Tokens) {
    this.db.data! = tokens
    await this.db.write()
  }
}
