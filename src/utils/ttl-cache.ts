interface CacheItem {
  data: string
  timestamp: number
}

export class TTLCache {
  private readonly cache = new Map<string, CacheItem>()

  constructor(private readonly ttl: number) {}

  get(key: string): string | undefined {
    const value = this.cache.get(key)

    if (value && Date.now() - value.timestamp < this.ttl) {
      return value.data
    }

    this.remove(key)

    return undefined
  }

  set(key: string, data: string): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  remove(key: string): void {
    this.cache.delete(key)
  }
}
