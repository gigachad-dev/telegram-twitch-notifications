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

  @Column('text', { nullable: true })
  title: string | null

  @Column('text', { nullable: true })
  game: string | null

  @Column('integer')
  messageId: number

  @OneToOne(() => Channel, (channel) => channel.stream, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'channelId' })
  channel?: Relation<Channel>

  @Column('text')
  channelId: string
}
