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

  @Column('text')
  title: string

  @Column('text')
  game: string

  @Column('integer')
  messageId: number

  @OneToOne(() => Channel, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  })
  @JoinColumn([{ name: 'tokenId', referencedColumnName: 'id' }])
  channel?: Relation<Channel>

  @Index()
  @Column('text', { nullable: true })
  channelId: string | null
}
