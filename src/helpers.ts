import { formatDuration, intervalToDuration } from 'date-fns'
import dedent from 'dedent'

export function escapeText(text: string): string {
  return text.replace(/\</g, '\\<').replace(/\>/g, '\\>')
}

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
    ${createdAt ? '🔴' : '🟢'} ${title ? escapeText(title) : username}${
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
