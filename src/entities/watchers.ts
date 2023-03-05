import { Type } from 'class-transformer'

export class Watchers {
  @Type(() => Watcher)
  watchers: Watcher[] = []
}

export class Watcher {
  chatId: number
  matches: string[]

  constructor(chatId: number, ...matches: string[]) {
    this.chatId = chatId
    this.matches = matches
  }
}
