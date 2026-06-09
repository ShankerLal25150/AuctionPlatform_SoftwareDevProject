/**
 * Service that handles auction item-related operations
 * Provides CRUD operations for auction items and user-specific item queries
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { AuctionItem, AuctionStatus } from '../models/item.model';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';
import { map, catchError } from 'rxjs/operators';
import { Bid } from '../models/bid.model';

/**
 * Service responsible for managing auction items
 */
@Injectable({
  providedIn: 'root',
})
export class ItemService {
  /**
   * Base API URL for auction items
   * @private
   */
  private apiUrl = `${environment.apiBaseUrl}/items`;

  /**
   * Service constructor
   * @param http - HttpClient for making API requests
   */
  constructor(private http: HttpClient) {}

  /**
   * Creates a new auction item
   * @param item The item data to create
   * @returns Observable of the created item
   */
  createItem(item: Partial<AuctionItem>): Observable<AuctionItem> {
    return this.http.post<AuctionItem>(this.apiUrl, item);
  }

  /**
   * Gets a specific auction item by ID
   * @param id The ID of the item to fetch
   * @returns Observable of the requested item
   */
  getItem(id: string): Observable<AuctionItem> {
    return this.http.get<AuctionItem>(`${this.apiUrl}/${id}`).pipe(
      map(item => this._processItemDetails(item))
    );
  }

  /**
   * Gets all items listed by a specific user
   * @param userId The ID of the user whose items to fetch
   * @returns Observable of the user's listed items
   */
  getUserItems(userId: string): Observable<AuctionItem[]> {
    return this.http.get<AuctionItem[]>(`${this.apiUrl}?userId=${userId}`).pipe(
      map(items => items.map(item => this._processItemDetails(item)))
    );
  }

  /**
   * Updates auction item details
   * @param itemId The ID of the item to update
   * @param updateData The data to update
   * @returns Observable of the updated item
   */
  updateItem(itemId: string, updateData: Partial<AuctionItem>): Observable<AuctionItem> {
    return this.http.put<AuctionItem>(`${this.apiUrl}/${itemId}`, updateData).pipe(
      map(item => this._processItemDetails(item))
    );
  }

  /**
   * Gets all auction items with optional filtering
   * @param searchQuery Optional search term to filter items
   * @param minPrice Optional minimum price filter
   * @param maxPrice Optional maximum price filter
   * @returns Observable of filtered auction items
   */
  getItems(searchQuery?: string, minPrice?: number, maxPrice?: number): Observable<AuctionItem[]> {
    let params = new HttpParams();
    if (searchQuery) {
      params = params.append('search', searchQuery);
    }
    if (minPrice !== undefined) {
      params = params.append('minPrice', minPrice.toString());
    }
    if (maxPrice !== undefined) {
      params = params.append('maxPrice', maxPrice.toString());
    }

    return this.http.get<AuctionItem[]>(this.apiUrl, { params }).pipe(
      map(items => items.map(item => this._processItemDetails(item)))
    );
  }

  /**
   * Processes item details to ensure correct data types and calculate derived fields
   * @param item The item to process
   * @returns Processed item with correct types and derived fields
   * @private
   */
  private _processItemDetails(item: AuctionItem): AuctionItem {
    const now = new Date();
    const endTime = new Date(item.endTime);
    let processedStatus: AuctionStatus = item.status;
    let winner: User | undefined = item.winner;
    let winningBidAmount: number | undefined = item.winningBidAmount;
    let currentPrice = Number(item.currentPrice);

    // Ensure bids are sorted by amount descending, then by time ascending (earlier bid wins ties)
    const sortedBids = item.bids?.sort((a, b) => {
      if (b.amount === a.amount) {
        return new Date(a.bidTime).getTime() - new Date(b.bidTime).getTime();
      }
      return b.amount - a.amount;
    });

    if (endTime <= now) { // Auction has ended
      if (sortedBids && sortedBids.length > 0) {
        const highestBid = sortedBids[0];
        winner = highestBid.bidder;
        winningBidAmount = highestBid.amount;
        currentPrice = highestBid.amount; // Final price is the highest bid
        processedStatus = 'SOLD';
      } else {
        processedStatus = 'ENDED_UNSOLD';
        winner = undefined; // Explicitly set no winner
        winningBidAmount = undefined;
        // currentPrice remains as startingPrice or last known price if no bids
      }
    } else { // Auction is active
      processedStatus = 'ACTIVE';
      winner = undefined; // No winner yet for active auctions
      winningBidAmount = undefined;
      if (sortedBids && sortedBids.length > 0) {
        currentPrice = sortedBids[0].amount; // Current price is the current highest bid
      }
      // If no bids, currentPrice remains as startingPrice
    }

    return {
      ...item,
      endTime: endTime, // Ensure endTime is a Date object
      startTime: new Date(item.startTime), // Ensure startTime is a Date object
      currentPrice: currentPrice,
      startingPrice: Number(item.startingPrice), // Ensure startingPrice is a number
      status: processedStatus,
      winner: winner,
      winningBidAmount: winningBidAmount,
      bids: item.bids?.map(b => ({ ...b, amount: Number(b.amount), bidTime: new Date(b.bidTime) })) // Ensure bid amounts are numbers and bidTime is Date
    };
  }
}
