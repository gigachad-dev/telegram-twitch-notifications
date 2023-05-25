import { AsyncAdapter, NodeProvider } from '@stenodb/node'
import { databasePath } from '../database/database.provider.js'
import { Metric, ThumbnailSchema } from './thumbnail.schema.js'

export class ThumbnailMetrics {
  private metricDatabaseProvider: NodeProvider
  private metricDatabase: AsyncAdapter<ThumbnailSchema>

  constructor() {
    this.metricDatabaseProvider = new NodeProvider({
      path: databasePath
    })

    this.metricDatabase = new AsyncAdapter(
      'fetch-thumbnail-metrics',
      ThumbnailSchema,
      { metrics: [] }
    )
  }

  private get currentDate() {
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
    await this.metricDatabaseProvider.create(this.metricDatabase)
    await this.metricDatabase.read()
  }

  async write(metric: Metric): Promise<void> {
    metric.end = this.currentDate
    this.metricDatabase.data!.metrics.push(metric)
    await this.metricDatabase.write()
  }
}
