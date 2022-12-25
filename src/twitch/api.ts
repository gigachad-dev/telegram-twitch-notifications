import { ApiClient as TwitchApiClient } from '@twurple/api'
import type { AuthProvider } from './auth.js'
import type { HelixStream, HelixUser } from '@twurple/api'

export class ApiClient {
  private readonly apiClient: TwitchApiClient

  constructor({ provider }: AuthProvider) {
    this.apiClient = new TwitchApiClient({ authProvider: provider })
  }

  async getStreamById(userId: string): Promise<HelixStream> {
    return await this.apiClient.streams.getStreamByUserId(userId)
  }

  async getChannelByName(name: string): Promise<HelixUser> {
    return await this.apiClient.users.getUserByName(name)
  }

  async getUsersById(userIds: string[]): Promise<HelixUser[]> {
    return await this.apiClient.users.getUsersByIds(userIds)
  }
}
