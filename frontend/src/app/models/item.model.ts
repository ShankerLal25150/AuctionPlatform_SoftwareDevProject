import { User } from './user.model';
import { Bid } from './bid.model';

/**
 * Represents the possible states of an auction
 */
export type AuctionStatus = 'ACTIVE' | 'SOLD' | 'ENDED_UNSOLD' | 'PENDING_PROCESSING';

/**
 * Interface representing an auction item in the system
 */
export interface AuctionItem {
  /** Unique identifier for the item */
  id: string;
  /** Title of the auction item */
  title: string;
  /** Detailed description of the item */
  description: string;
  /** Initial price set by the seller */
  startingPrice: number;
  /** Current highest bid amount or final selling price */
  currentPrice: number;
  /** When the auction starts */
  startTime: Date;
  /** When the auction ends */
  endTime: Date;
  /** Current status of the auction */
  status: AuctionStatus;
  /** User who is selling the item */
  seller: User;
  /** List of all bids placed on this item */
  bids?: Bid[];
  /** User who won the auction, if ended and sold */
  winner?: User;
  /** Final winning bid amount */
  winningBidAmount?: number;
}
