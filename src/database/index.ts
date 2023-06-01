import { DatabaseChannels } from './channel/channel.js'
import { DatabaseProvider } from './database-provider.js'
import { DatabaseThumbnail } from './thumbnails/thumbnails.js'
import { DatabaseTokens } from './tokens/tokens.js'
import { DatabaseWatchers } from './watchers/watchers.js'

export const databaseProvider = new DatabaseProvider()

export const databaseChannels = new DatabaseChannels(databaseProvider)
databaseChannels.init()

export const databaseTokens = new DatabaseTokens(databaseProvider)
await databaseTokens.init()

export const databaseWatchers = new DatabaseWatchers(databaseProvider)
databaseWatchers.init()

export const databaseThumbnail = new DatabaseThumbnail(databaseProvider)
databaseThumbnail.init()
