import type { Stream } from './stream.js'

export class Channel {
  constructor(
    public channelId: string,
    public topicId: number,
    public stream: Stream | null = null
  ) {}
}
