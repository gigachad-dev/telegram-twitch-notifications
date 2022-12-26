import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('token')
export class Token {
  @PrimaryGeneratedColumn('uuid')
  id: number

  @Column('text')
  accessToken: string

  @Column('text')
  refreshToken: string

  @Column('integer')
  expiresIn: number

  @Column('timestamp')
  obtainmentTimestamp: Date
}

export type Tokens = Omit<Token, 'id'>
