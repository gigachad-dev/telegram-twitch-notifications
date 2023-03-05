import { ApiClient } from '@twurple/api'
import { singleton } from 'tsyringe'
import { AuthService } from './auth.service.js'
import type { HelixChannel, HelixUser } from '@twurple/api'

@singleton()
export class ApiService {
  apiClient: ApiClient

  constructor(private readonly authService: AuthService) {}

  async init(): Promise<void> {
    this.apiClient = new ApiClient({ authProvider: this.authService.provider })
  }

  async getChannelInfoByIds(userIds: string[]): Promise<HelixChannel[]> {
    return this.apiClient.channels.getChannelInfoByIds(userIds)
  }

  async getChannelInfoById(userId: string): Promise<HelixChannel | null> {
    return this.apiClient.channels.getChannelInfoById(userId)
  }

  async getChannelByName(userName: string): Promise<HelixUser | null> {
    return await this.apiClient.users.getUserByName(userName)
  }

  async getChannelsByNames(userName: string[]): Promise<HelixUser[]> {
    return await this.apiClient.users.getUsersByNames(userName)
  }

  async getUsersById(userIds: string[]): Promise<HelixUser[]> {
    return await this.apiClient.users.getUsersByIds(userIds)
  }

  getThumbnailUrl(userName: string): string {
    return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${userName}-1920x1080.jpg?timestamp=${Date.now()}`
  }
}
