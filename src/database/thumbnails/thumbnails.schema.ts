import { Type } from 'class-transformer'

export class ThumbnailsSchema {
  @Type(() => Metric)
  metrics: Metric[] = []
}

export class Metric {
  start: string
  end: string
  url: string
  iterations: number
  username: string
}
