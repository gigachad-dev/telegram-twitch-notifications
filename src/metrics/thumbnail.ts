import { AsyncAdapter, NodeProvider } from '@stenodb/node'
import { singleton } from 'tsyringe'
import { databasePath } from '../database/database.provider.js'
import { Metric, ThumbnailSchema } from './thumbnail.schema.js'
import type { AsyncProvider } from '@stenodb/node'

@singleton()
export class ThumbnailMetrics {
  private provider: NodeProvider
  private adapter: AsyncAdapter<ThumbnailSchema>
  private db: AsyncProvider<ThumbnailSchema>

  constructor() {
    this.provider = new NodeProvider({ path: databasePath })
    this.adapter = new AsyncAdapter('thumbnail-metrics', ThumbnailSchema, {
      metrics: []
    })
  }

  private get currentDate(): string {
    return new Date().toLocaleString()
  }

  createMetric(username: string): Metric {
    const metric = new Metric()
    metric.start = this.currentDate
    metric.username = username
    metric.iterations = 0
    return metric
  }

  async init(): Promise<void> {
    this.db = await this.provider.create(this.adapter)
    await this.db.read()
  }

  async write(metric: Metric): Promise<void> {
    metric.end = this.currentDate
    this.adapter.data!.metrics.push(metric)
    await this.adapter.write()
  }
}
