import { ApiClient as TwitchApiClient } from '@twurple/api'
import type { AuthProvider } from './auth.js'

export class ApiClient {
  private readonly apiClient: TwitchApiClient

  constructor({ provider }: AuthProvider) {
    this.apiClient = new TwitchApiClient({ authProvider: provider })
  }

  async getStreamById(userId: string) {
    return await this.apiClient.streams.getStreamByUserId(userId)
  }

  async getChannelByName(name: string) {
    return await this.apiClient.users.getUserByName(name)
  }
}
