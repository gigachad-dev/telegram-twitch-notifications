interface CacheItem {
  data: string
  timestamp: number
}

export class TTLCache {
  private readonly ttl: number
  private readonly cache: Map<string, CacheItem>

  constructor(ttl: number) {
    this.ttl = ttl
    this.cache = new Map()
  }

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
