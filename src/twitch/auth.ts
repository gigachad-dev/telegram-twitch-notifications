import {
  AccessToken,
  accessTokenIsExpired,
  RefreshingAuthProvider
} from '@twurple/auth'
import { config } from '../config.js'
import { Repositories } from '../repositories.js'
import type { Tokens } from '../entities/token.js'

export class AuthProvider {
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

  async getTokens(): Promise<Tokens | null> {
    const tokens = await Repositories.token
      .createQueryBuilder('token')
      .select('token')
      .orderBy({ 'token.id': 'DESC' })
      .getOne()

    return tokens
  }

  private async onRefreshToken(accessToken: AccessToken): Promise<void> {
    const tokens = {
      ...accessToken,
      obtainmentTimestamp: new Date(accessToken.obtainmentTimestamp)
    }

    await Repositories.token.save(tokens)
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
      const obtainmentTimestamp = tokensFromDb.obtainmentTimestamp.getTime()
      const tokens = { ...tokensFromDb, obtainmentTimestamp }
      const tokensIsExpired = accessTokenIsExpired(tokens)

      if (tokensIsExpired) {
        return initialTokens
      }

      return tokens
    }

    return initialTokens
  }
}
