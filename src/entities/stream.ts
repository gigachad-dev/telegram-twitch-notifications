import { Type } from 'class-transformer'

interface StreamSchema {
  title: string | null
  game: string | null
  messageId: number
  createdAt: Date
}

export class Stream implements StreamSchema {
  title: string | null
  game: string | null
  messageId: number

  @Type(() => Date)
  createdAt: Date

  constructor({ title, game, messageId, createdAt }: StreamSchema) {
    this.title = title
    this.game = game
    this.messageId = messageId
    this.createdAt = createdAt
  }
}
