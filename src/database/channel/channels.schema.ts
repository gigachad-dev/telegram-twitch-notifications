import { Type } from 'class-transformer'
import { Stream } from './stream.schema.js'
import type { StreamSchema } from './stream.schema.js'

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
    this.stream = Object.assign(this.stream ?? {}, stream) as Stream
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

  getChannelByName(name: string): Channel | undefined {
    return this.channels.find(
      (channel) => channel.displayName.toLowerCase() === name.toLowerCase()
    )
  }

  getChannelById(channelId: string): Channel | undefined {
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
