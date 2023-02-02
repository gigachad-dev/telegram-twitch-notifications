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
  stream: Stream | null

  constructor({
    channelId,
    displayName,
    chatId,
    stream = null
  }: ChannelSchema) {
    this.channelId = channelId
    this.displayName = displayName
    this.chatId = chatId
    this.stream = stream
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
