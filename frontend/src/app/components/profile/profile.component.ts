import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Added MatProgressSpinnerModule
import { RouterModule } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, switchMap, catchError, map } from 'rxjs/operators';
import { User } from '../../models/user.model';
import { AuctionItem, AuctionStatus } from '../../models/item.model'; // Import AuctionStatus
import { Bid } from '../../models/bid.model';
import { AuthService } from '../../services/auth.service';
import { ItemService } from '../../services/item.service';
import { BidService } from '../../services/bid.service';

/**
 * Interface that extends AuctionItem to include the user's highest bid amount.
 * Used for displaying items in the user's bidding activity.
 */
export interface ProfileAuctionItem extends AuctionItem {
  /** The highest bid amount placed by the current user on this item */
  userHighestBid?: number;
}

/**
 * Component that displays a user's profile information, including:
 * - Items they have listed for auction
 * - Auctions they have won
 * - Auctions they have lost
 * - Active auctions they are participating in
 * 
 * This is a standalone component that uses Material Design components for the UI.
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    RouterModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  /** The currently logged in user */
  user: User | null = null;
  
  /** Items that the current user has listed for auction */
  userItems: AuctionItem[] = [];
  
  /** All bids placed by the current user */
  userBids: Bid[] = [];

  /** Auctions that the user has won */
  wonAuctions: ProfileAuctionItem[] = [];
  
  /** Auctions that the user participated in but lost */
  lostAuctions: ProfileAuctionItem[] = [];
  
  /** Active auctions where the user has placed bids */
  activeBiddedItems: ProfileAuctionItem[] = [];

  /** Loading state for the user's listed items */
  isLoadingListedItems = false;
  
  /** Loading state for the user's bidding activity */
  isLoadingBiddingActivity = false;

  /** Subject for handling component destruction and cleaning up subscriptions */
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private itemService: ItemService,
    private bidService: BidService,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Initializes the component by subscribing to the current user
   * and loading their items and bidding activity when available.
   */
  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
        if (user) {
          this.loadUserItems();
          this.loadUserBiddingActivity();
        } else {
          this.resetProfileData();
        }
        this.cdr.detectChanges();
      });
  }

  /**
   * Resets all profile data to its initial state.
   * Called when the user logs out or when data needs to be cleared.
   * @private
   */
  private resetProfileData(): void {
    this.userItems = [];
    this.userBids = [];
    this.wonAuctions = [];
    this.lostAuctions = [];
    this.activeBiddedItems = [];
    this.isLoadingListedItems = false;
    this.isLoadingBiddingActivity = false;
  }

  /**
   * Loads all items that the current user has listed for auction.
   * Updates the loading state and sorts items by end time.
   * @private
   */
  private loadUserItems(): void {
    if (!this.user) return;
    this.isLoadingListedItems = true;
    this.itemService.getUserItems(this.user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.userItems = items.sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());
          this.isLoadingListedItems = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading user items:', error);
          this.isLoadingListedItems = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Loads the bidding activity for the current user, including:
   * - Auctions they have won
   * - Auctions they have lost
   * - Active auctions they are participating in
   * 
   * This method fetches the user's bids, determines the items they have bid on,
   * and categorizes the items into won, lost, and active auctions.
   * @private
   */
  private loadUserBiddingActivity(): void {
    if (!this.user) return;
    this.isLoadingBiddingActivity = true;

    this.bidService.getUserBids(this.user.id).pipe(
      takeUntil(this.destroy$),
      switchMap(bids => {
        this.userBids = bids; // Store raw bids to check participation
        if (bids.length === 0) {
          this.clearBiddingCategoriesAndStopLoading();
          return of([]); 
        }
        // Get unique item IDs the user has bid on
        const itemIds = [...new Set(bids.map(bid => bid.item?.id).filter(id => id != null))] as string[];
        if (itemIds.length === 0) {
            this.clearBiddingCategoriesAndStopLoading();
            return of([]);
        }
        // Fetch full details for each item the user has bid on
        return forkJoin(
          itemIds.map(id => 
            this.itemService.getItem(id).pipe(
              map(item => {
                // Augment item with the user's highest bid for THIS item
                const userHighestBidOnThisItem = this.getUserHighestBidAmountForItem(id, bids);
                return {...item, userHighestBid: userHighestBidOnThisItem } as ProfileAuctionItem;
              }),
              catchError(err => {
                console.error(`Error fetching item ${id} for bidding activity:`, err);
                return of(null); // Continue if one item fails to load, will be filtered out
              })
            )
          )
        );
      }),
      map(detailedItemsData => detailedItemsData.filter(item => item !== null) as ProfileAuctionItem[]) // Filter out nulls from failed fetches
    ).subscribe({
      next: (validItems) => {
        this.categorizeBiddedItems(validItems);
        this.isLoadingBiddingActivity = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading user bidding activity:', error);
        this.clearBiddingCategoriesAndStopLoading();
        this.cdr.detectChanges();
      }
    });
  }
  
  /**
   * Clears the bidding categories (won, lost, active) and stops the loading indicator
   * for the user's bidding activity.
   * @private
   */
  private clearBiddingCategoriesAndStopLoading(): void {
    this.wonAuctions = [];
    this.lostAuctions = [];
    this.activeBiddedItems = [];
    this.isLoadingBiddingActivity = false; // Ensure loading is stopped
  }

  /**
   * Retrieves the highest bid amount that the current user has placed on a specific item.
   * @param itemId The ID of the item to check.
   * @param userBids The list of bids placed by the current user.
   * @returns The highest bid amount, or undefined if no bids were found for the item.
   * @private
   */
  private getUserHighestBidAmountForItem(itemId: string, userBids: Bid[]): number | undefined {
    if (!this.user) return undefined;
    // Filter bids for the specific item AND made by the current user
    const bidsForItemByCurrentUser = userBids
      .filter(bid => bid.item?.id === itemId && bid.bidder?.id === this.user?.id);
    
    if (bidsForItemByCurrentUser.length === 0) {
      return undefined; // User made no bids on this specific item (should not happen if itemIds are derived from userBids)
    }
    return Math.max(...bidsForItemByCurrentUser.map(bid => bid.amount));
  }

  /**
   * Categorizes the detailed item data into won, lost, and active auctions
   * based on the user's bidding activity.
   * @param detailedItems The detailed item data to categorize.
   * @private
   */
  private categorizeBiddedItems(detailedItems: ProfileAuctionItem[]): void {
    this.wonAuctions = [];
    this.lostAuctions = [];
    this.activeBiddedItems = [];

    if (!this.user) return;

    detailedItems.forEach(item => {
      // Ensure user actually participated in this auction by checking userBids list
      const userParticipated = this.userBids.some(b => b.item?.id === item.id && b.bidder?.id === this.user?.id);
      if (!userParticipated) {
        return; // Skip if user didn't bid on this item, even if it appeared in itemIds (e.g. data inconsistency)
      }

      switch (item.status) {
        case 'SOLD':
          if (item.winner?.id === this.user?.id) {
            this.wonAuctions.push(item);
          } else {
            // User participated in an auction that was sold to someone else
            this.lostAuctions.push(item);
          }
          break;
        case 'ENDED_UNSOLD':
          // User participated in an auction that ended without a winner
          this.lostAuctions.push(item);
          break;
        case 'ACTIVE':
        case 'PENDING_PROCESSING': // Treat pending as active for display purposes here
          this.activeBiddedItems.push(item);
          break;
      }
    });

    // Sort for consistent display (e.g., by end time, most recent first)
    const sortByEndTimeDesc = (a: ProfileAuctionItem, b: ProfileAuctionItem) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime();
    this.wonAuctions.sort(sortByEndTimeDesc);
    this.lostAuctions.sort(sortByEndTimeDesc);
    this.activeBiddedItems.sort(sortByEndTimeDesc);
  }

  /**
   * Determines if an auction has ended for a given item.
   * An auction is considered ended if the current time is past the item's end time,
   * or if the item status is 'SOLD' or 'ENDED_UNSOLD'.
   * @param item The auction item to check.
   * @returns True if the auction has ended, false otherwise.
   */
  isAuctionEnded(item: AuctionItem): boolean {
    // This can now directly use the processed status if available, 
    // but checking time is also fine for a generic utility.
    // For status-specific logic, prefer item.status.
    return new Date(item.endTime) < new Date() || item.status === 'SOLD' || item.status === 'ENDED_UNSOLD';
  }

  /**
   * Gets the display status of a listed item for the current user.
   * The status includes a text description and a CSS class for styling.
   * @param item The auction item to get the status for.
   * @returns An object containing the status text and CSS class.
   */
  getListedItemStatus(item: AuctionItem): {
    text: string;
    cssClass: string;
  } {
    if (!this.user || item.seller?.id !== this.user.id) {
      return { text: 'Status N/A', cssClass: 'status-unknown' };
    }

    switch (item.status) {
      case 'ACTIVE':
        return { text: 'Active', cssClass: 'status-active' };
      case 'SOLD':
        const winnerName = item.winner?.name || 'N/A'; // Use item.winner.name
        const price = item.winningBidAmount|| item.currentPrice;
        return {
          text: `Sold to ${winnerName} for ${price} ETH`,
          cssClass: 'status-ended-winner',
        };
      case 'ENDED_UNSOLD':
        return { text: 'Ended (Unsold)', cssClass: 'status-ended-no-winner' };
      case 'PENDING_PROCESSING':
        return { text: 'Processing...', cssClass: 'status-active' }; // Or a specific 'status-processing'
      default:
        // Fallback for any unexpected status, should ideally not happen
        const now = new Date();
        const endTime = new Date(item.endTime);
        if (endTime > now) {
          return { text: 'Active (Fallback)', cssClass: 'status-active' };
        }
        if (item.winner) {
          return { text: `Sold (Fallback)`, cssClass: 'status-ended-winner' };
        }
        return { text: 'Ended (Fallback)', cssClass: 'status-ended-no-winner' };
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
