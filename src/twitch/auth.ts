import { accessTokenIsExpired, RefreshingAuthProvider } from '@twurple/auth'
import { config } from '../config.js'
import { database } from '../database.js'
import { Token } from '../entities/token.js'
import type { Tokens } from '../entities/token.js'

export class AuthProvider {
  private readonly repository = database.getRepository(Token)
  private _authProvider: RefreshingAuthProvider

  async initialize(): Promise<void> {
    const tokens = await this.authTokens()

    this._authProvider = new RefreshingAuthProvider(
      {
        clientId: config.CLIENT_ID,
        clientSecret: config.CLIENT_SECRET,
        onRefresh: (token) => this.onRefreshToken(token)
      },
      tokens
    )
  }

  get provider(): RefreshingAuthProvider {
    return this._authProvider
  }

  async getTokens(): Promise<Token | null> {
    const tokens = await this.repository
      .createQueryBuilder('token')
      .select('token')
      .orderBy({ 'token.id': 'DESC' })
      .getOne()

    return tokens
  }

  async saveTokens(tokens: Tokens): Promise<void> {
    await this.repository.save(tokens)
  }

  private onRefreshToken(accessToken: Tokens): void {
    this.saveTokens(accessToken)
  }

  private async authTokens() {
    const initialTokens = {
      accessToken: config.ACCESS_TOKEN,
      refreshToken: config.REFRESH_TOKEN,
      expiresIn: 1,
      obtainmentTimestamp: 0
    }

    const tokensFromDb = await this.getTokens()
    if (tokensFromDb) {
      const tokensIsExpired = accessTokenIsExpired(tokensFromDb)

      if (tokensIsExpired) {
        return initialTokens
      }

      return tokensFromDb
    }

    return initialTokens
  }
}
