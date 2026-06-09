import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Item } from '../../items/entities/item.entity';
import { Bid } from '../../bids/entities/bid.entity';

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: 'profile_picture' })
  profilePicture: string;

  @OneToMany(() => Item, (item: Item) => item.seller)
  items: Item[];

  @OneToMany(() => Bid, (bid: Bid) => bid.bidder)
  bids: Bid[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
