import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  ManyToOne, 
  OneToMany, 
  CreateDateColumn,
  JoinColumn 
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { Bid } from '../../bids/entities/bid.entity';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ name: 'starting_price', type: 'numeric' })
  startingPrice: number;

  @Column({ name: 'current_price', type: 'numeric', nullable: true })
  currentPrice: number;

  @Column({ name: 'end_time', type: 'timestamp' })
  endTime: Date;

  @ManyToOne(() => Users, (user: Users) => user.items, { nullable: false })
  @JoinColumn({ name: 'seller_id' })
  seller: Users;

  @OneToMany(() => Bid, (bid: Bid) => bid.item)
  bids: Bid[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}