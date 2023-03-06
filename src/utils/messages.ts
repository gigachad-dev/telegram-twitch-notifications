import { HelixUser } from '@twurple/api'
import { formatDuration, intervalToDuration } from 'date-fns'
import dedent from 'dedent'
import { md } from 'telegram-escape'
import type { Channel } from '../entities/channels.js'

interface NotificationMessageArgs {
  title: string | null
  game: string | null
  username: string
  createdAt?: Date | null
  endedAt?: Date
}

export function notificationMessage({
  title,
  game,
  username,
  createdAt,
  endedAt
}: NotificationMessageArgs): string {
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

export function channelsMessage(channels: Channel[]): string {
  const channelLinks = channels
    .map(
      (channel) =>
        `[${channel.displayName}](https://twitch.tv/${channel.displayName})`
    )
    .join('\n')

  return dedent`
    📄 Каналы:

    ${channelLinks}
  `
}

interface StreamMessageArgs {
  channel: string
  sender: string
  message: string
}

export function streamsMessage({
  channel,
  sender,
  message
}: StreamMessageArgs): string {
  return dedent`
    [${channel}](https://twitch.tv/${channel}) ⤵️
    [${sender}](https://twitch.tv/${sender}): ${md`${message}`}
  `
}

export async function channelsOnlineMessage(
  channels: HelixUser[]
): Promise<string> {
  const streams: string[] = []

  for (const channel of channels) {
    const streamInfo = await channel.getStream()
    if (!streamInfo) continue

    streams.push(
      // prettier-ignore
      dedent`
        [${channel.displayName}](https://twitch.tv/${channel.name}) 👀 ${streamInfo.viewers}
        ${md`${streamInfo.title}`}${streamInfo.gameName ? ` — ${streamInfo.gameName}` : ''}\n
      `
    )
  }

  return streams.join('\n')
}
