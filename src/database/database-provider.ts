import { NodeProvider } from '@stenodb/node'
import { databasePath } from '../config/paths.js'

export class DatabaseProvider extends NodeProvider {
  constructor() {
    super({ path: databasePath })
  }
}
