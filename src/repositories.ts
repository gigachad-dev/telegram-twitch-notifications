import { database } from './database.js'
import { Channel, Stream, Token } from './entities/index.js'

export class Repositories {
  static channel = database.getRepository(Channel)
  static stream = database.getRepository(Stream)
  static token = database.getRepository(Token)

  static async deleteChannel(id: string) {
    await this.channel.delete({ id })
  }

  static async getChannel(id: string) {
    return await Repositories.channel.findOne({
      where: { id },
      relations: {
        stream: true
      }
    })
  }

  static async addChannel({ id, topicId }: Channel) {
    await this.channel.insert({ id, topicId })
  }

  static async deleteStream(id: string) {
    await this.stream.delete({ channelId: id })
  }

  static async upsertStream({
    channelId,
    title,
    game,
    messageId
  }: Omit<Stream, 'id'>) {
    await this.stream.upsert(
      {
        channelId,
        messageId,
        title: title || null,
        game: game || null
      },
      {
        conflictPaths: ['channelId'],
        skipUpdateIfNoValuesChanged: true
      }
    )
  }
}
