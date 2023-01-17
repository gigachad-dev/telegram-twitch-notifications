import { AccessToken } from '@twurple/auth'

interface TokensSchema extends Omit<AccessToken, 'obtainmentTimestamp'> {
  obtainmentTimestamp: Date
}

export class Tokens implements TokensSchema {
  accessToken: string
  refreshToken: string | null
  expiresIn: number | null
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
    this.obtainmentTimestamp = new Date(obtainmentTimestamp)
    this.scope = scope
  }
}
