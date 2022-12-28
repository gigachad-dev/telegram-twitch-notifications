import { ApiClient } from '@twurple/api'
import { singleton } from 'tsyringe'
import { AuthService } from './auth.service.js'
import type { HelixStream, HelixUser } from '@twurple/api'

@singleton()
export class ApiService {
  private apiClient: ApiClient

  constructor(private readonly authService: AuthService) {}

  async init(): Promise<void> {
    this.apiClient = new ApiClient({ authProvider: this.authService.provider })
  }

  async getStreamById(userId: string): Promise<HelixStream | null> {
    return await this.apiClient.streams.getStreamByUserId(userId)
  }

  async getChannelByName(name: string): Promise<HelixUser | null> {
    return await this.apiClient.users.getUserByName(name)
  }

  async getUsersById(userIds: string[]): Promise<HelixUser[]> {
    return await this.apiClient.users.getUsersByIds(userIds)
  }
}
