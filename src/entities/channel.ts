import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Stream } from './stream.js'

@Entity('channel')
export class Channel {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  channelId: string

  @Column({ unique: true })
  displayName: string

  @Column()
  topicId: number

  @OneToOne(() => Stream, (stream) => stream.channel)
  stream: Stream
}
