import { Type } from 'class-transformer'
import { Stream } from './stream.js'

interface ChannelSchema {
  channelId: string
  displayName: string
  chatId: number
  stream?: Stream | null
}

export class Channel implements ChannelSchema {
  channelId: string
  displayName: string
  chatId: number

  @Type(() => Stream)
  stream: Stream | null = null

  updateEndedAt(endedAt: Date | null = null): void {
    if (!this.stream) return
    this.stream.endedAt = endedAt
  }

  addStream(stream: Stream): void {
    this.stream = stream
  }

  deleteStream(): void {
    this.stream = null
  }
}

export class Channels {
  @Type(() => Channel)
  channels: Channel[] = []

  getChannelIds(): string[] {
    return this.channels.map((channel) => channel.channelId)
  }

  getChannel(channelId: string): Channel | undefined {
    return this.channels.find((channel) => channel.channelId === channelId)
  }

  addChannel(channel: Channel): void {
    this.channels.push(channel)
  }

  deleteChannel(channelId: string): void {
    this.channels = this.channels.filter(
      (channel) => channel.channelId !== channelId
    )
  }
}
