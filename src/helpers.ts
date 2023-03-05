import { formatDuration, intervalToDuration } from 'date-fns'
import dedent from 'dedent'
import { md } from 'telegram-escape'

export function generateNotificationMessage({
  title,
  game,
  username,
  createdAt,
  endedAt
}: {
  title: string | null
  game: string | null
  username: string
  createdAt?: Date | null
  endedAt?: Date
}): string {
  return dedent`
    ${createdAt ? '🔴' : '🟢'} ${title ? md`${title}` : username}${
    game ? ` — ${game}` : ''
  }${
    createdAt && endedAt
      ? `\n🕒 ${formatDuration(
          intervalToDuration({ start: createdAt, end: endedAt })
        )}`
      : ''
  }
    https://twitch.tv/${username.toLowerCase()}
  `
}

export class RLUCache {
  private readonly ttl: number
  private readonly cache: Map<string, { data: string; timestamp: number }>

  constructor(ttl: number) {
    this.ttl = ttl
    this.cache = new Map()
  }

  get(key: string): string | undefined {
    const value = this.cache.get(key)

    if (value && Date.now() - value.timestamp < this.ttl) {
      return value.data
    }

    this.remove(key)

    return undefined
  }

  set(key: string, data: string): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  remove(key: string): void {
    this.cache.delete(key)
  }
}

export function getRandomEmoji(): string {
  const emojis = [
    '😄',
    '😃',
    '😀',
    '😊',
    '☺',
    '😉',
    '😍',
    '😘',
    '😚',
    '😗',
    '😙',
    '😜',
    '😝',
    '😛',
    '😳',
    '😁',
    '😔',
    '😌',
    '😒',
    '😞',
    '😣',
    '😢',
    '😂',
    '😭',
    '😪',
    '😥',
    '😰',
    '😅',
    '😓',
    '😩',
    '😫',
    '😨',
    '😱',
    '😠',
    '😡',
    '😤',
    '😖',
    '😆',
    '😋',
    '😷',
    '😎',
    '😴',
    '😵',
    '😲',
    '😟',
    '😦',
    '😧',
    '😈',
    '👿',
    '😮',
    '😬',
    '😐',
    '😕',
    '😯',
    '😶',
    '😇',
    '😏',
    '😑'
  ]
  return emojis[Math.floor(Math.random() * emojis.length)]!
}
