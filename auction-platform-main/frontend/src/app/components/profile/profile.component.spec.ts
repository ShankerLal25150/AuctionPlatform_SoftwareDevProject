import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of, throwError, Subject } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { AuthService } from '../../services/auth.service';
import { ItemService } from '../../services/item.service';
import { BidService } from '../../services/bid.service';
import { User } from '../../models/user.model';
import { AuctionItem } from '../../models/item.model';
import { Bid } from '../../models/bid.model';

// Material Modules
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

// Mock Data
const mockUser: User = {
  id: 'user1',
  name: 'Test User',
  email: 'test@example.com',
};

const mockUserItems: AuctionItem[] = [
  { id: 'item1', title: 'User Item 1', description: 'Desc 1', startingPrice: 10, currentPrice: 10, endTime: new Date().toISOString(), sellerId: 'user1', status: 'ACTIVE' },
  { id: 'item2', title: 'User Item 2', description: 'Desc 2', startingPrice: 20, currentPrice: 20, endTime: new Date().toISOString(), sellerId: 'user1', status: 'ACTIVE' },
];

const mockUserBids: Bid[] = [
  { id: 'bid1', itemId: 'item3', userId: 'user1', amount: 50, bidTime: new Date().toISOString() },
  { id: 'bid2', itemId: 'item4', userId: 'user1', amount: 75, bidTime: new Date().toISOString() },
];

// Mock Services
class MockAuthService {
  currentUser$ = new BehaviorSubject<User | null>(null);
  // Helper to simulate login
  simulateLogin(user: User | null): void {
    this.currentUser$.next(user);
  }
}

class MockItemService {
  getUserItems(userId: string) {
    return of(mockUserItems);
  }
}

class MockBidService {
  getUserBids(userId: string) {
    return of(mockUserBids);
  }
}

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authService: MockAuthService;
  let itemService: MockItemService;
  let bidService: MockBidService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        RouterModule.forRoot([]), // For routerLink in template if any
        NoopAnimationsModule,
        MatTabsModule,
        MatCardModule,
        MatListModule,
        MatIconModule,
        MatButtonModule,
        ProfileComponent // Standalone component
      ],
      providers: [
        { provide: AuthService, useClass: MockAuthService },
        { provide: ItemService, useClass: MockItemService },
        { provide: BidService, useClass: MockBidService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    itemService = TestBed.inject(ItemService) as unknown as MockItemService;
    bidService = TestBed.inject(BidService) as unknown as MockBidService;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set user and load user items and bids when currentUser$ emits a user', fakeAsync(() => {
      spyOn(itemService, 'getUserItems').and.callThrough();
      spyOn(bidService, 'getUserBids').and.callThrough();

      authService.simulateLogin(mockUser);
      fixture.detectChanges(); // Triggers ngOnInit
      tick(); // Allow async operations like service calls to complete

      expect(component.user).toEqual(mockUser);
      expect(itemService.getUserItems).toHaveBeenCalledWith(mockUser.id);
      expect(component.userItems).toEqual(mockUserItems);
      expect(bidService.getUserBids).toHaveBeenCalledWith(mockUser.id);
      expect(component.userBids).toEqual(mockUserBids);
    }));

    it('should not load items or bids if currentUser$ emits null', () => {
      spyOn(itemService, 'getUserItems');
      spyOn(bidService, 'getUserBids');

      authService.simulateLogin(null);
      fixture.detectChanges(); // Triggers ngOnInit

      expect(component.user).toBeNull();
      expect(itemService.getUserItems).not.toHaveBeenCalled();
      expect(bidService.getUserBids).not.toHaveBeenCalled();
      expect(component.userItems).toEqual([]);
      expect(component.userBids).toEqual([]);
    });

    it('should handle error when loading user items', fakeAsync(() => {
      spyOn(itemService, 'getUserItems').and.returnValue(throwError(() => new Error('Item service error')));
      spyOn(console, 'error');

      authService.simulateLogin(mockUser);
      fixture.detectChanges();
      tick();

      expect(component.userItems).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error loading user items:', jasmine.any(Error));
    }));

    it('should handle error when loading user bids', fakeAsync(() => {
      spyOn(bidService, 'getUserBids').and.returnValue(throwError(() => new Error('Bid service error')));
      spyOn(console, 'error');

      authService.simulateLogin(mockUser);
      fixture.detectChanges();
      tick();

      expect(component.userBids).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error loading user bids:', jasmine.any(Error));
    }));
  });

  describe('isAuctionEnded', () => {
    it('should return true if item endTime is in the past', () => {
      const endedItem: AuctionItem = { ...mockUserItems[0], endTime: new Date(Date.now() - 100000).toISOString() };
      expect(component.isAuctionEnded(endedItem)).toBeTrue();
    });

    it('should return false if item endTime is in the future', () => {
      const activeItem: AuctionItem = { ...mockUserItems[0], endTime: new Date(Date.now() + 100000).toISOString() };
      expect(component.isAuctionEnded(activeItem)).toBeFalse();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject to prevent memory leaks', () => {
      fixture.detectChanges(); // Call ngOnInit to set up subscriptions
      const destroySubject = (component as any).destroy$ as Subject<void>; // Access private member for test
      spyOn(destroySubject, 'next').and.callThrough();
      spyOn(destroySubject, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(destroySubject.next).toHaveBeenCalled();
      expect(destroySubject.complete).toHaveBeenCalled();
    });
  });
});
