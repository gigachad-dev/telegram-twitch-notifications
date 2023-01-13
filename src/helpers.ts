import dedent from 'dedent'

export function escapeText(text: string): string {
  return text.replace(/\</g, '\\<').replace(/\>/g, '\\>')
}

export function generateNotificationMessage({
  title,
  game,
  username,
  ended
}: {
  title: string | null
  game: string | null
  username: string
  ended: boolean
}): string {
  return dedent`
    ${ended ? '🔴' : '🟢'} ${title ? escapeText(title) : username}${
    game ? ` — ${game}` : ''
  }
    https://twitch.tv/${username.toLowerCase()}
  `
}
