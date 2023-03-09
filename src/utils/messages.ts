import { formatDuration, intervalToDuration } from 'date-fns'
import dedent from 'dedent'
import { escapeMarkdown } from './escapeMarkdown.js'
import type { Channel } from '../entities/channels.js'
import type { HelixStream } from '@twurple/api'

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
    ${createdAt ? '🔴' : '🟢'} ${title ? title : username}${
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
    [${sender}](https://twitch.tv/${sender}): ${escapeMarkdown(message)}
  `
}

export function channelsOnlineMessage(streams: HelixStream[]): string {
  const msg: string[] = []

  for (const stream of streams) {
    msg.push(
      // prettier-ignore
      dedent`
        [${stream.userDisplayName}](https://twitch.tv/${stream.userName}) 👀 ${stream.viewers}
        ${escapeMarkdown(stream.title)}${stream.gameName ? ` — ${stream.gameName}` : ''}\n
      `
    )
  }

  return msg.join('\n')
}
