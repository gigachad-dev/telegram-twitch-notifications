import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm'
import { Channel } from './channel.js'
import type { Relation } from 'typeorm'

@Entity('stream')
export class Stream {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  channelId: string

  @Column()
  messageId: number

  @Column()
  title: string

  @Column()
  game: string

  @OneToOne(() => Channel, (channel) => channel.stream)
  @JoinColumn({ name: 'channelId' })
  channel: Relation<Channel>
}
