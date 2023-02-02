import { AccessToken } from '@twurple/auth'
import { Type } from 'class-transformer'

interface TokensSchema extends Omit<AccessToken, 'obtainmentTimestamp'> {
  obtainmentTimestamp: Date
}

export class Token implements TokensSchema {
  accessToken: string
  refreshToken: string | null
  expiresIn: number | null

  @Type(() => Date)
  obtainmentTimestamp: Date
  scope: string[]

  constructor({
    accessToken,
    refreshToken,
    expiresIn,
    obtainmentTimestamp,
    scope
  }: TokensSchema) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    this.expiresIn = expiresIn
    this.obtainmentTimestamp = obtainmentTimestamp
    this.scope = scope
  }
}

export class Tokens {
  @Type(() => Token)
  tokens: Token | null = null
}
