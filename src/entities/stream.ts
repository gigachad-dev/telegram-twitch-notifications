import { Type } from 'class-transformer'

export interface StreamSchema {
  title: string | null
  game: string | null
  messageId: number
  createdAt: Date
  endedAt?: Date | null
}

export class Stream implements StreamSchema {
  title: string | null
  game: string | null
  messageId: number

  @Type(() => Date)
  createdAt: Date

  @Type(() => Date)
  endedAt: Date | null = null
}
