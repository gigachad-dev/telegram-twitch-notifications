import { AsyncAdapter } from '@stenodb/node'
import { DatabaseProvider } from '../database-provider.js'
import { Metric, ThumbnailsSchema } from '../thumbnails/thumbnails.schema.js'
import type { AsyncProvider } from '@stenodb/node'

export class DatabaseThumbnail {
  private thumbnails: AsyncProvider<ThumbnailsSchema>

  constructor(private readonly database: DatabaseProvider) {}

  async init(): Promise<void> {
    const adapter = new AsyncAdapter(
      'thumbnail-metrics',
      ThumbnailsSchema,
      new ThumbnailsSchema()
    )
    this.thumbnails = await this.database.create(adapter)
    await this.thumbnails.read()
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

  async write(metric: Metric): Promise<void> {
    metric.end = this.currentDate
    this.thumbnails.data!.metrics.push(metric)
    await this.thumbnails.write()
  }
}
