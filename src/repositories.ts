import { database } from './database.js'
import { Channel, Stream, Token } from './entities/index.js'

export class Repositories {
  static channel = database.getRepository(Channel)
  static stream = database.getRepository(Stream)
  static token = database.getRepository(Token)
}
