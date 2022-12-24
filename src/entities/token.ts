import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('token')
export class Token {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  accessToken: string

  @Column()
  refreshToken: string

  @Column()
  expiresIn: number

  @Column()
  obtainmentTimestamp: number
}

export type Tokens = Omit<Token, 'id'>
