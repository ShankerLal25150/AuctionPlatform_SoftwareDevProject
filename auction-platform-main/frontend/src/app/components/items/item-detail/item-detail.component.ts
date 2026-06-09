/**
 * Component that displays detailed information about an auction item and handles bidding functionality
 */
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, Observable, interval, of, switchMap, tap, take, map, catchError } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { HttpErrorResponse } from '@angular/common/http';
import { ItemService } from '../../../services/item.service';
import { BidService } from '../../../services/bid.service';
import { AuthService } from '../../../services/auth.service';
import { AuctionItem } from '../../../models/item.model';
import { Bid } from '../../../models/bid.model';
import { User } from '../../../models/user.model';
import { PriceHistoryChartComponent } from '../../charts/price-history-chart/price-history-chart.component';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatDividerModule,
    MatListModule,
    PriceHistoryChartComponent,
  ],
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.scss'],
})
export class ItemDetailComponent implements OnInit, OnDestroy {
  /** Current auction item being displayed */
  item: AuctionItem | null = null;
  
  /** List of bids placed on this item */
  bids: Bid[] = [];
  
  /** Form for placing new bids */
  bidForm: FormGroup;
  
  /** Flag indicating if a bid is currently being placed */
  isPlacingBid = false;
  
  /** Subject for handling component cleanup */
  private readonly destroy$ = new Subject<void>();
  
  /** Observable of the currently authenticated user */
  currentUser$: Observable<User | null>;

  /**
   * Creates an instance of ItemDetailComponent
   */
  constructor(
    private readonly route: ActivatedRoute,
    private readonly itemService: ItemService,
    private readonly bidService: BidService,
    private readonly authService: AuthService,
    private readonly fb: FormBuilder,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.bidForm = this.fb.group({
      amount: ['', [Validators.required]]
    });
  }

  /**
   * Initializes the component, sets up data loading and refresh intervals
   */
  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const itemIdFromRoute = params.get('id');
        if (!itemIdFromRoute) {
          this.snackBar.open('Item ID not found in route.', 'Close', { duration: 3000 });
          this.item = null;
          this.bids = [];
          this.cdr.detectChanges();
          return of(null);
        }

        // --- PRODUCTION DATA LOADING ---
        return this.loadItemAndBidsReal(itemIdFromRoute).pipe(
          tap(() => {
            // Optional: Set up polling for data refresh
            interval(30000) // Refresh every 30 seconds
              .pipe(
                takeUntil(this.destroy$),
                switchMap(() => this.loadItemAndBidsReal(itemIdFromRoute, true))
              )
              .subscribe({
                error: err => console.error('ItemDetailComponent: Error during periodic refresh:', err)
              });
          })
        );
        // --- END PRODUCTION DATA LOADING ---
      })
    ).subscribe({
      next: (loadedItem) => {
        if (loadedItem) {
          console.log('ItemDetailComponent: Item loaded:', this.item?.title);
        } else {
          // Handle case where item loading failed but didn't throw an error handled by the catchError in loadItemAndBidsReal
          // This might occur if loadItemAndBidsReal returns of(null) without an error that bubbles to this subscription's error handler
          console.log('ItemDetailComponent: Item could not be loaded.');
        }
      },
      error: (err) => {
        // This error handler is for errors that might occur in the main paramMap pipe itself,
        // or if loadItemAndBidsReal re-throws an error that isn't caught internally.
        console.error('ItemDetailComponent: Critical error in ngOnInit subscription:', err);
        this.snackBar.open(`Critical error loading item: ${err.message || 'Unknown error'}`, 'Close', { duration: 5000 });
        this.item = null;
        this.bids = [];
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Loads item details and bid history from the server
   * @param itemId - ID of the item to load
   * @param isRefresh - Whether this is a refresh of existing data
   * @returns Observable of the loaded item or null if not found
   */
  private loadItemAndBidsReal(itemId: string, isRefresh: boolean = false): Observable<AuctionItem | null> {
    if (!isRefresh) {
      console.log(`ItemDetailComponent: Loading item ${itemId} from service...`);
    } else {
      console.log(`ItemDetailComponent: Refreshing item ${itemId} from service...`);
    }

    return this.itemService.getItem(itemId).pipe(
      switchMap(itemData => {
        if (!itemData) {
          if (!isRefresh) { // Only show snackbar on initial load failure, not on refresh if item disappears
            this.snackBar.open(`Item with ID ${itemId} not found.`, 'Close', { duration: 3000 });
          }
          this.item = null;
          this.bids = [];
          this.cdr.detectChanges();
          return of(null);
        }
        this.item = itemData;
        this.updateBidFormValidators(); // Initial update based on fetched item

        return this.bidService.getBidsByItem(itemData.id).pipe( // Corrected method name
          tap((bidsData: Bid[]) => {
            this.bids = bidsData.sort((a: Bid, b: Bid) => new Date(b.bidTime).getTime() - new Date(a.bidTime).getTime()); // Most recent first for list

            if (this.item) { // Recalculate currentPrice based on bids
              if (this.bids.length > 0) {
                const highestBidAmount = Math.max(...this.bids.map(b => b.amount));
                this.item.currentPrice = Math.max(highestBidAmount, this.item.startingPrice);
              } else {
                this.item.currentPrice = this.item.startingPrice;
              }
              this.updateBidFormValidators(); // Update validators again if currentPrice changed
            }
            this.cdr.detectChanges();
          }),
          map(() => this.item) // Ensure the outer observable chain gets the item
        );
      }),
      catchError((err: HttpErrorResponse | Error) => {
        console.error('ItemDetailComponent: Error loading real item data:', err);
        let errorMessage = 'Error loading item data.';
        if (err instanceof HttpErrorResponse) {
          errorMessage = err.error?.message || err.message || errorMessage;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        if (!isRefresh) { // Only show snackbar on initial load error
          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        }
        this.item = null;
        this.bids = [];
        this.cdr.detectChanges();
        return of(null); // Return null to allow the main subscription to handle UI updates for error state
      })
    );
  }

  /**
   * Cleans up component resources
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handles bid form submission
   */
  onSubmitBid(): void {
    if (this.bidForm.invalid || !this.item || this.isAuctionEnded()) {
      let message = 'Cannot place bid: ';
      if (this.bidForm.invalid) message += 'Form is invalid. ';
      if (!this.item) message += 'Item data missing. ';
      if (this.item && this.isAuctionEnded()) message += 'Auction has ended. ';
      this.snackBar.open(message.trim(), 'Close', { duration: 4000 });
      return;
    }

    this.isPlacingBid = true;
    const bidAmount = this.bidForm.value.amount;

    this.authService.currentUser$.pipe(take(1)).subscribe(currentUserFromAuth => {
      if (!currentUserFromAuth) {
        this.snackBar.open('You must be logged in to place a bid.', 'Close', { duration: 3000 });
        this.isPlacingBid = false;
        this.cdr.detectChanges();
        return;
      }

      // currentUserFromAuth is now confirmed to be User, and this.item is AuctionItem.
      const bidderName = currentUserFromAuth.name;
      const currentItemId = this.item!.id; // this.item is non-null here.

      // Mock bid submission logic removed.

      // --- PRODUCTION BID SUBMISSION ---
      // The BidService.placeBid method expects itemId and amount as separate arguments.
      // The backend will associate the bid with the authenticated user (currentUserFromAuth).
      this.bidService.placeBid(this.item!.id, bidAmount).subscribe({
        next: (newBid: Bid) => {
          this.snackBar.open('Bid placed successfully!', 'Close', { duration: 3000 });
          // Add the new bid to the list and resort
          this.bids = [newBid, ...this.bids].sort((a, b) => new Date(b.bidTime).getTime() - new Date(a.bidTime).getTime());

          if (this.item) {
            this.item.currentPrice = newBid.amount;
            // Optionally, if your item model has a bids array you want to keep in sync on the frontend immediately:
            // if (this.item.bids) { this.item.bids.unshift(newBid); } else { this.item.bids = [newBid]; }
          }

          this.bidForm.reset();
          this.updateBidFormValidators();
          this.isPlacingBid = false;
          this.cdr.detectChanges();

          // Optionally, refresh all bids for the item to ensure consistency, though the newBid should be accurate.
          this.loadItemAndBidsReal(this.item!.id, true).subscribe(); 
        },
        error: (err: HttpErrorResponse) => {
          this.handleBidError(err);
          this.isPlacingBid = false;
          this.cdr.detectChanges(); // Ensure UI updates on error
        },
      });
      // --- END PRODUCTION BID SUBMISSION ---
    });
  }

  /**
   * Updates bid form validators based on current item price
   */
  private updateBidFormValidators(): void {
    if (!this.item) return;
    
    const minBid = (this.item.currentPrice ?? this.item.startingPrice) + 0.01;
    const minBidFormatted = minBid;
    
    const amountControl = this.bidForm.get('amount');
    if (amountControl) {
      amountControl.setValidators([
        Validators.required,
        Validators.min(minBid),
        Validators.pattern(/^[0-9]+(\.[0-9]{1,2})?$/) // Ensures proper decimal format
      ]);
      
      // Update the error message for the min validator
      amountControl.updateValueAndValidity();
      
      // Set the placeholder to show the minimum bid
      const inputElement = document.querySelector('input[formControlName="amount"]') as HTMLInputElement;
      if (inputElement) {
        inputElement.placeholder = `Minimum bid: $${minBidFormatted}`;
      }
    }
  }

  /**
   * Checks if the auction has ended
   * @returns true if auction end time is in the past
   */
  isAuctionEnded(): boolean {
    return this.item ? new Date(this.item.endTime) < new Date() : true;
  }

  /**
   * Calculates and formats the time remaining in the auction
   * @returns Formatted string showing days/hours/minutes remaining
   */
  getTimeLeft(): string {
    if (!this.item) return 'Loading...';
    if (this.isAuctionEnded()) return 'Auction Ended';
    const diff = new Date(this.item.endTime).getTime() - new Date().getTime();
    if (diff <= 0) return 'Auction Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);

    let timeLeftString = '';
    if (days > 0) timeLeftString += `${days}d `;
    if (hours > 0 || days > 0) timeLeftString += `${hours}h `;
    timeLeftString += `${minutes}m`;
    return timeLeftString.trim();
  }

  /**
   * Handles and formats bid submission errors
   * @param error - HTTP error from bid submission
   */
  private handleBidError(error: HttpErrorResponse): void {
    let errorMessage = 'Failed to place bid. Please try again.';
    
    if (error.status === 400) {
      if (error.error?.message?.includes('Bid must be higher')) {
        const minBid = (this.item?.currentPrice ?? this.item?.startingPrice ?? 0) + 0.01;
        errorMessage = `Bid must be higher than current price. Minimum bid is $${minBid}.`;
      } else {
        errorMessage = error.error?.message || 'Invalid bid. Please check your bid amount.';
      }
    } else if (error.status === 401) {
      errorMessage = 'You must be logged in to place a bid.';
    } else if (error.status === 403) {
      errorMessage = 'You are not authorized to place this bid.';
    } else if (error.status === 404) {
      errorMessage = 'Auction item not found or auction has ended.';
    }
    
    this.snackBar.open(errorMessage, 'Close', { 
      duration: 5000,
      panelClass: ['error-snackbar'] // Add this to your global styles
    });
  }
}
