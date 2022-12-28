import {
  AccessToken,
  accessTokenIsExpired,
  RefreshingAuthProvider
} from '@twurple/auth'
import { injectable, singleton } from 'tsyringe'
import { ConfigService } from '../config/config.service.js'
import { DatabaseService } from '../database/database.service.js'
import type { Tokens } from '../entities/token.js'

@singleton()
export class AuthService {
  private _authProvider: RefreshingAuthProvider

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService
  ) {}

  async initialize(): Promise<void> {
    const { clientId, clientSecret } = this.configService.twitchTokens
    const tokens = await this.authTokens()

    this._authProvider = new RefreshingAuthProvider(
      {
        clientId,
        clientSecret,
        onRefresh: (token) => this.onRefreshToken(token)
      },
      tokens
    )

    await this._authProvider.refresh()
  }

  get provider(): RefreshingAuthProvider {
    return this._authProvider
  }

  private async onRefreshToken(accessToken: AccessToken): Promise<void> {
    const tokens = {
      ...accessToken,
      obtainmentTimestamp: new Date(accessToken.obtainmentTimestamp)
    } as Tokens

    await this.databaseService.upsertTokens(tokens)
  }

  private async authTokens() {
    const { accessToken, refreshToken } = this.configService.twitchTokens
    const initialTokens = {
      accessToken,
      refreshToken,
      expiresIn: 1,
      obtainmentTimestamp: 0
    }

    const currentTokens = await this.databaseService.getTokens()
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
