import { AccessToken } from '@twurple/auth'
import { Type } from 'class-transformer'

interface TokensSchema extends Omit<AccessToken, 'obtainmentTimestamp'> {
  obtainmentTimestamp: Date
}

export class Tokens implements TokensSchema {
  accessToken: string
  refreshToken: string | null
  expiresIn: number | null

  @Type(() => Date)
  obtainmentTimestamp: Date
  scope: string[]

  constructor(
    accessToken: string,
    refreshToken: string | null,
    expiresIn: number | null,
    obtainmentTimestamp: Date,
    scope: string[]
  ) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    this.expiresIn = expiresIn
    this.obtainmentTimestamp = obtainmentTimestamp
    this.scope = scope
  }
}
