import { ApiClient } from '@twurple/api'
import { wait } from '@zero-dependency/utils'
import { singleton } from 'tsyringe'
import { AuthService } from './auth.service.js'
import type { HelixChannel, HelixStream, HelixUser } from '@twurple/api'

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

  async getStreamsByIds(userIds: string[]): Promise<HelixStream[]> {
    return await this.apiClient.streams.getStreamsByUserIds(userIds)
  }

  async getThumbnail(userName: string): Promise<string> {
    const url = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${userName}-1920x1080.jpg`

    for (let i = 0; i < 10; i++) {
      const response = await fetch(url + `?timestamp=${Date.now()}`)
      if (!response.redirected) return url
      await wait(60 * 1000)
    }

    return url
  }
}
