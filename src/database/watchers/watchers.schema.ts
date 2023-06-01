import { Type } from 'class-transformer'

export class Watchers {
  @Type(() => Watcher)
  watchers: Watcher[] = []
}

const bots = [
  'moobot',
  'twirapp',
  'nightbot',
  'eventpupa',
  'streamlabs',
  'streamelements'
]

export class Watcher {
  chatId: number
  allowed_words: string[]
  ignored_users: string[]

  constructor(
    chatId: number,
    allow_words: string[] = [],
    ignore_users: string[] = []
  ) {
    this.chatId = chatId
    this.allowed_words = allow_words
    this.ignored_users = [...bots, ...ignore_users]
  }
}
