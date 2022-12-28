import { injectable } from 'tsyringe'
import { Repository } from 'typeorm'
import { Channel, Stream, Token, Tokens } from '../entities/index.js'
import { DatabaseProvider } from './database.provider.js'

@injectable()
export class DatabaseService {
  private readonly channel: Repository<Channel>
  private readonly stream: Repository<Stream>
  private readonly token: Repository<Token>

  constructor(private readonly database: DatabaseProvider) {
    this.channel = this.database.getRepository(Channel)
    this.stream = this.database.getRepository(Stream)
    this.token = this.database.getRepository(Token)
  }

  async init() {
    await this.database.initialize()
    await this.database.runMigrations()
  }

  async getStreams() {
    return await this.channel.find({
      relations: {
        stream: true
      }
    })
  }

  async getTokens() {
    const tokens = await this.token.find({
      order: {
        id: 'DESC'
      },
      take: 1
    })

    return tokens[0]
  }

  async upsertTokens(tokens: Tokens) {
    this.token.save(tokens)
  }

  async deleteChannel(id: string) {
    await this.channel.delete({ id })
  }

  async getChannel(id: string) {
    return await this.channel.findOne({
      where: { id },
      relations: {
        stream: true
      }
    })
  }

  async addChannel({ id, topicId }: Channel) {
    await this.channel.insert({ id, topicId })
  }

  async deleteStream(id: string) {
    await this.stream.delete({ channelId: id })
  }

  async upsertStream({
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
