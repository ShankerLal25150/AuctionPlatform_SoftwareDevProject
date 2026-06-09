import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  ManyToOne, 
  CreateDateColumn,
  JoinColumn 
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { Item } from '../../items/entities/item.entity';

@Entity('bids')
export class Bid {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('numeric')
  amount: number;

  @ManyToOne(() => Users, (user: Users) => user.bids, { nullable: false })
  @JoinColumn({ name: 'bidder_id' })
  bidder: Users;

  @ManyToOne(() => Item, (item: Item) => item.bids, { nullable: false })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @CreateDateColumn({ name: 'bid_time', type: 'timestamp' })
  bidTime: Date;
}