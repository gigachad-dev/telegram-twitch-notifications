import { database } from './database.js'
import { Channel, Stream, Token } from './entities/index.js'

export class Repositories {
  static channel = database.getRepository(Channel)
  static stream = database.getRepository(Stream)
  static token = database.getRepository(Token)

  static async removeChannel(id: string) {
    await this.removeStream(id)
    await this.channel.delete({ id })
  }

  static async getChannel(id: string) {
    return await Repositories.channel.findOneBy({ id })
  }

  static async addChannel({ id, topicId }: Channel) {
    await this.channel.insert({ id, topicId })
  }

  static async removeStream(id: string) {
    await this.stream.delete({ channelId: id })
  }

  static async addStream({
    channelId,
    title,
    game,
    messageId
  }: Omit<Stream, 'id'>) {
    await this.stream.upsert(
      {
        channelId,
        title,
        game,
        messageId
      },
      {
        conflictPaths: ['channelId'],
        skipUpdateIfNoValuesChanged: true
      }
    )
  }
}
