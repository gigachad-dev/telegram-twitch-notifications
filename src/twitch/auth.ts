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
    const tokens = await Repositories.token.find({
      order: {
        id: 'DESC'
      },
      take: 1
    })

    return tokens[0]
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

    const currentTokens = await this.getTokens()
    if (currentTokens) {
      const parsedTokens = {
        ...currentTokens,
        obtainmentTimestamp: currentTokens.obtainmentTimestamp.getTime()
      }

      const tokensIsExpired = accessTokenIsExpired(parsedTokens)
      if (tokensIsExpired) return initialTokens

      return parsedTokens
    }

    return initialTokens
  }
}
