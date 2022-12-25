import {
  Column,
  Entity,
  Index,
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
  title: string

  @Column()
  game: string

  @Column()
  messageId: number

  @OneToOne(() => Channel, (channel) => channel.stream)
  @JoinColumn({ name: 'tokenId' })
  channel?: Relation<Channel>

  @Column()
  channelId: string
}
