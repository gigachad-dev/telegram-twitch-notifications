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
}

export class Tokens {
  @Type(() => Token)
  tokens: Token | null = null

  constructor(tokens: Token | null = null) {
    this.tokens = tokens
  }
}
