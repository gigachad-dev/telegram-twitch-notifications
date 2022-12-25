import { Column, Entity, OneToOne, PrimaryColumn } from 'typeorm'
import { Stream } from './stream.js'
import type { Relation } from 'typeorm'

@Entity('channel')
export class Channel {
  @PrimaryColumn({ unique: true })
  id: string

  @Column()
  topicId: number

  @OneToOne(() => Stream, (stream) => stream.channel)
  stream?: Relation<Stream>
}
