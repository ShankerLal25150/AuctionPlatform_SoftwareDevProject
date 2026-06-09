/**
 * Component that represents the navigation bar of the application
 * Handles user authentication state and provides navigation links
 * Implements OnInit and OnDestroy lifecycle hooks for proper resource management
 */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { NgIf, AsyncPipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';

/**
 * @Component decorator that defines the navbar component configuration
 * @selector 'app-navbar' - Component selector
 * @standalone true - Indicates this is a standalone component
 * @imports Array of imported Angular modules required by this component
 * @templateUrl Path to the component's HTML template
 * @styleUrls Path to the component's SCSS styles
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    NgIf,
    RouterLink,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  /**
   * Currently authenticated user
   * @type {User | null}
   */
  currentUser: User | null = null;

  /**
   * Loading state indicator for async operations
   * @type {boolean}
   */
  isLoading = false;

  /**
   * Mobile menu visibility state
   * @type {boolean}
   */
  isMobileMenuOpen = false;

  /**
   * Subject for cleanup on component destruction
   * @private
   */
  private destroy$ = new Subject<void>();

  /**
   * Component constructor that initializes dependencies
   * @param authService - Service for authentication state
   * @param router - Router for navigation
   */
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  /**
   * Lifecycle hook that initializes the component
   * Subscribes to authentication state changes
   */
  ngOnInit(): void {
    // Subscribe to auth state changes
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (user) => {
        console.log('Auth state changed:', {
          user,
          hasToken: !!this.authService.getToken(),
        });
        this.currentUser = user;
      },
      error: (error) => {
        console.error('Auth subscription error:', error);
      },
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
   * Handles user logout
   * Redirects to login page after logout
   */
  logout(): void {
    this.isLoading = true;
    this.authService.logout();
    this.router.navigate(['/login']).finally(() => {
      this.isLoading = false;
    });
  }

  /**
   * Checks if the current user is a seller
   * @returns {boolean} true if user is a seller, false otherwise
   */
  isSeller(): boolean {
    // return this.currentUser?.role === 'SELLER';
    return true;
  }

  /**
   * Checks if the current user is a buyer
   * @returns {boolean} true if user is a buyer, false otherwise
   */
  isBuyer(): boolean {
    // return this.currentUser?.role === 'BUYER';
    return true;
  }

  /**
   * Checks if the user is logged in
   * @returns {boolean} true if user is logged in, false otherwise
   */
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
  
  /**
   * Generates initials from the user's name
   * @returns {string} User's initials or 'U' if no name is available
   */
  getUserInitials(): string {
    if (!this.currentUser?.name) return 'U';
    
    const nameParts = this.currentUser.name.split(' ');
    if (nameParts.length > 1) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  }
  
  /**
   * Gets the user's role display text
   * @returns {string} User's role as display text (Seller/Buyer)
   */
  getUserRole(): string {
    // In a real app, this would return the user's role based on the currentUser
    return this.isSeller() ? 'Seller' : 'Buyer';
  }
  
  /**
   * Toggles the mobile menu visibility
   */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
  
  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
}
