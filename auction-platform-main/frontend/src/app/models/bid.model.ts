import { User } from './user.model';
import { AuctionItem } from './item.model';

/**
 * Interface representing a bid placed on an auction item
 */
export interface Bid {
  /** Unique identifier for the bid */
  id: number;
  /** The bid amount */
  amount: number;
  /** When the bid was placed */
  bidTime: Date;
  /** User who placed the bid */
  bidder: User;
  /** Item being bid on */
  item: AuctionItem;
  /** Whether this is the current highest/winning bid */
  isWinning?: boolean;
  /** Current status of the auction from this bid's perspective */
  auctionStatus?: 'ACTIVE' | 'ENDED' | 'WON' | 'LOST';
}
