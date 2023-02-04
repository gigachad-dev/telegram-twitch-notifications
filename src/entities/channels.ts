import { Type } from 'class-transformer'
import { Stream } from './stream.js'
import type { StreamSchema } from './stream.js'

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

  updateStream(stream: Partial<StreamSchema>): void {
    const newStream = new Stream()
    Object.assign(newStream, stream)
    this.stream = newStream
  }

  deleteStream(): void {
    if (!this.stream) return
    this.stream.endedAt = null
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
