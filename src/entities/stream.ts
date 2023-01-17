interface StreamSchema {
  title: string | null
  game: string | null
  messageId: number
}

export class Stream implements StreamSchema {
  title: string | null
  game: string | null
  messageId: number

  constructor({ title, game, messageId }: StreamSchema) {
    this.title = title
    this.game = game
    this.messageId = messageId
  }
}
