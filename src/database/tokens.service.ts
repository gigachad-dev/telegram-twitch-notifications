import { singleton } from 'tsyringe'
import { Token, Tokens } from '../entities/tokens.js'
import { DatabaseProvider } from './database.provider.js'
import type { NodeAdapter } from 'stenodb'

@singleton()
export class DatabaseTokensService {
  private db: NodeAdapter<Tokens>

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async init(): Promise<void> {
    this.db = this.databaseProvider.createDatabase({
      name: 'tokens',
      entity: Tokens,
      initialData: null
    })

    return Promise.resolve()
  }

  get tokens() {
    return this.db.data!.tokens
  }

  write(tokens: Token) {
    this.db.data!.tokens = tokens
    this.db.write()
  }
}
