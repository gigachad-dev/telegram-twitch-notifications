import { ApiClient } from '@twurple/api'
import type { RefreshingAuthProvider } from '@twurple/auth'

export class TwitchApiClient {
  private readonly apiClient: ApiClient

  constructor(authProvider: RefreshingAuthProvider) {
    this.apiClient = new ApiClient({ authProvider })
  }

  async getStreamById(userId: string) {
    return await this.apiClient.streams.getStreamByUserId(userId)
  }

  async getChannelByName(name: string) {
    return await this.apiClient.users.getUserByName(name)
  }
}
