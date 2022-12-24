import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Stream } from './stream.js'

@Entity('channel')
export class Channel {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  channelId: string

  @Column()
  topicId: number

  @OneToMany(() => Stream, (stream) => stream.channel)
  streams: Stream[]
}
