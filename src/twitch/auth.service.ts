import {
  AccessToken,
  accessTokenIsExpired,
  RefreshingAuthProvider
} from '@twurple/auth'
import { env } from '../config/env.js'
import { DatabaseTokens } from '../database/tokens/tokens.js'
import { Tokens } from '../database/tokens/tokens.schema.js'

export class AuthService {
  private authProvider: RefreshingAuthProvider

  constructor(private readonly databaseTokens: DatabaseTokens) {}

  async init(): Promise<void> {
    const tokens = this.authTokens()

    this.authProvider = new RefreshingAuthProvider({
      clientId: env.CLIENT_ID,
      clientSecret: env.CLIENT_SECRET,
      onRefresh: (userId, token) => this.onRefreshToken(token)
    })

    await this.authProvider.addUserForToken(tokens, ['chat'])
  }

  get provider(): RefreshingAuthProvider {
    return this.authProvider
  }

  private async onRefreshToken(accessToken: AccessToken): Promise<void> {
    const tokens = new Tokens(
      accessToken.accessToken,
      accessToken.refreshToken,
      accessToken.expiresIn,
      new Date(accessToken.obtainmentTimestamp),
      accessToken.scope
    )

    await this.databaseTokens.write(tokens)
  }

  private authTokens() {
    const initialTokens = {
      accessToken: env.ACCESS_TOKEN,
      refreshToken: env.REFRESH_TOKEN,
      expiresIn: 1,
      obtainmentTimestamp: 0
    }

    const currentTokens = this.databaseTokens.data
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
