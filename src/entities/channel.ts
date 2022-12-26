import { Column, Entity, OneToOne, PrimaryColumn } from 'typeorm'
import { Stream } from './stream.js'
import type { Relation } from 'typeorm'

@Entity('channel')
export class Channel {
  @PrimaryColumn('text', { unique: true })
  id: string

  @Column('integer')
  topicId: number

  @OneToOne(() => Stream, (stream) => stream.channel)
  stream?: Relation<Stream>
}
