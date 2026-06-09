/**
 * Component that displays a list of auction items with filtering and search capabilities.
 * Implements OnInit and OnDestroy lifecycle hooks for proper resource management.
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Observable, Subject, takeUntil, interval } from 'rxjs';
import { ItemService } from '../../../services/item.service';
import { AuthService } from '../../../services/auth.service';
import { AuctionItem } from '../../../models/item.model';
import { User } from '../../../models/user.model';

/**
 * @Component decorator that defines the item list component configuration
 * @selector 'app-item-list' - Component selector
 * @standalone true - Indicates this is a standalone component
 * @imports Array of imported Angular modules required by this component
 * @templateUrl Path to the component's HTML template
 * @styleUrls Path to the component's SCSS styles
 */
@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule
  ],
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.scss']
})
export class ItemListComponent implements OnInit, OnDestroy {
  /**
   * Array of auction items to display
   * @type {AuctionItem[]}
   */
  items: AuctionItem[] = [];

  /**
   * Loading state indicator
   * @type {boolean}
   */
  isLoading = true;

  /**
   * Search query string for filtering items
   * @type {string}
   */
  searchQuery = '';

  /**
   * Minimum price filter
   * @type {number | undefined}
   */
  minPrice?: number;

  /**
   * Maximum price filter
   * @type {number | undefined}
   */
  maxPrice?: number;

  /**
   * Subject for cleanup on component destruction
   * @private
   */
  private destroy$ = new Subject<void>();

  /**
   * Observable that emits the current user state
   * @type {Observable<User | null>}
   */
  currentUser$: Observable<User | null>;

  /**
   * Component constructor that initializes dependencies
   * @param itemService - Service for fetching auction items
   * @param authService - Service for authentication state
   * @param router - Router for navigation
   */
  constructor(
    private itemService: ItemService,
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  /**
   * Lifecycle hook that initializes the component
   * Sets up item loading and periodic refresh
   */
  ngOnInit(): void {
    this.loadItems();
    
    // Set up periodic refresh (every 30 seconds)
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refreshItems();
      });
  }

  /**
   * Lifecycle hook that cleans up resources when component is destroyed
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handler for search form submission
   * Triggers item loading with current search parameters
   */
  onSearch(): void {
    this.loadItems();
  }

  /**
   * Loads auction items from the service with current filters
   * Handles loading state and error cases
   */
  loadItems(): void {
    this.isLoading = true;
    this.itemService.getItems(this.searchQuery, this.minPrice, this.maxPrice)
      .subscribe({
        next: (items) => {
          this.items = items;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading items:', error);
          this.isLoading = false;
          // Check if we're getting a 404 or other specific error
          if (error.status === 404) {
            console.warn('Items endpoint not found. Check if the backend server is running and the endpoint is correct');
          }
          // Initialize empty array to show "No auctions found" message
          this.items = [];
        }
      });
  }
  
  refreshItems(): void {
    // Only refresh if not already loading
    if (!this.isLoading) {
      this.itemService.getItems(this.searchQuery, this.minPrice, this.maxPrice)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (items) => {
            this.items = items;
          },
          error: (error) => {
            console.error('Error refreshing items:', error);
          }
        });
    }
  }



  navigateToItem(id: string): void {
    this.router.navigate(['/items', id]);
  }

  isEndingSoon(item: AuctionItem): boolean {
    const now = new Date();
    const end = new Date(item.endTime);
    const hoursLeft = (end.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursLeft <= 24;
  }

  getTimeLeft(item: AuctionItem): string {
    const now = new Date();
    const end = new Date(item.endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Auction ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  }
}
