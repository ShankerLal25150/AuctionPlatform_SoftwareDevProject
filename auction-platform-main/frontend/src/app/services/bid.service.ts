/**
 * Service that handles auction bid-related operations
 * Provides functionality for placing bids and retrieving bid history
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Bid } from '../models/bid.model';

/**
 * Service responsible for managing auction bids
 */
@Injectable({
  providedIn: 'root'
})
export class BidService {
  /**
   * Base API URL for auction bids
   * @private
   */
  private apiUrl = `${environment.apiBaseUrl}/bids`;

  /**
   * Service constructor
   * @param http - HttpClient for making API requests
   */
  constructor(private http: HttpClient) {}

  /**
   * Gets all bids for a specific auction item
   * @param itemId ID of the auction item
   * @returns Observable of bids for the item
   */
  getBidsByItem(itemId: string): Observable<Bid[]> {
    return this.http.get<Bid[]>(`${this.apiUrl}/${itemId}`).pipe(
      map(bids => bids.map(bid => ({
        ...bid,
        amount: Number(bid.amount),
        bidTime: new Date(bid.bidTime)
      })))
    );
  }

  /**
   * Places a new bid on an auction item
   * @param itemId ID of the item to bid on
   * @param amount Bid amount
   * @returns Observable of the created bid
   * @throws Error if bid placement fails
   */
  placeBid(itemId: string, amount: number): Observable<Bid> {
    const payload = {
      itemId,
      amount: amount.toString()
    };
    
    return this.http.post<Bid>(this.apiUrl, payload).pipe(
      map(bid => ({
        ...bid,
        amount: Number(bid.amount),
        bidTime: new Date(bid.bidTime)
      })),
      catchError(error => {
        console.error('Error placing bid:', error);
        if (error.error) {
          console.error('Error details:', error.error);
        }
        throw error;
      })
    );
  }

  /**
   * Gets all bids placed by a specific user
   * @param userId ID of the user
   * @returns Observable of the user's bids
   */
  getUserBids(userId: string): Observable<Bid[]> {
    return this.http.get<Bid[]>(`${environment.apiBaseUrl}/bids`).pipe(
      map(bids => bids.filter(bid => bid.bidder?.id.toString() === userId.toString())),
      map(bids => bids.map(bid => ({
        ...bid,
        amount: Number(bid.amount),
        bidTime: new Date(bid.bidTime)
      })))
    );
  }
}
