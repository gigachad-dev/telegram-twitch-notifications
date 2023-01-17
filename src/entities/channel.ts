import type { Stream } from './stream.js'

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
}
