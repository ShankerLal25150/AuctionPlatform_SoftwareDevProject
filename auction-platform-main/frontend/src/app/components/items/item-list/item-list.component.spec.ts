import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject, BehaviorSubject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { ItemListComponent } from './item-list.component';
import { ItemService } from '../../../services/item.service';
import { AuthService } from '../../../services/auth.service';
import { AuctionItem } from '../../../models/item.model';
import { User } from '../../../models/user.model';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// Mocks
const mockItems: AuctionItem[] = [
  {
    id: '1',
    title: 'Item 1',
    description: 'Description 1',
    startingPrice: 10,
    currentPrice: 15,
    endTime: new Date(Date.now() + 3600 * 1000 * 2).toISOString(), // 2 hours from now
    imageUrl: 'img1.jpg',
    sellerId: 'seller1',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Item 2',
    description: 'Description 2',
    startingPrice: 20,
    currentPrice: 25,
    endTime: new Date(Date.now() + 3600 * 1000 * 25).toISOString(), // 25 hours from now
    imageUrl: 'img2.jpg',
    sellerId: 'seller2',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class MockItemService {
  getItems(searchQuery?: string, minPrice?: number, maxPrice?: number) {
    return of(mockItems);
  }
}

class MockAuthService {
  currentUser$ = new BehaviorSubject<User | null>({ id: 'user1', name: 'Test User', email: 'test@user.com' });
}

class MockRouter {
  navigate(commands: any[]) {}
}

describe('ItemListComponent', () => {
  let component: ItemListComponent;
  let fixture: ComponentFixture<ItemListComponent>;
  let itemService: ItemService;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        NoopAnimationsModule,
        MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
        MatInputModule, MatSelectModule, MatProgressBarModule,
        ItemListComponent // Standalone component
      ],
      providers: [
        { provide: ItemService, useClass: MockItemService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: Router, useClass: MockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemListComponent);
    component = fixture.componentInstance;
    itemService = TestBed.inject(ItemService);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    // fixture.detectChanges(); // ngOnInit is called here, control in tests
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call loadItems on initialization', () => {
      spyOn(component, 'loadItems');
      fixture.detectChanges(); // Triggers ngOnInit
      expect(component.loadItems).toHaveBeenCalled();
    });

    it('should set up periodic refresh for items', fakeAsync(() => {
      spyOn(component, 'refreshItems');
      fixture.detectChanges(); // ngOnInit, initial loadItems called
      
      tick(29999); // Just before interval fires
      expect(component.refreshItems).not.toHaveBeenCalled();
      
      tick(1); // Interval fires (total 30000ms)
      expect(component.refreshItems).toHaveBeenCalledTimes(1);

      tick(30000); // Another interval
      expect(component.refreshItems).toHaveBeenCalledTimes(2);

      component.ngOnDestroy(); // Clean up
      flushMicrotasks();
    }));
  });

  describe('loadItems', () => {
    it('should set isLoading to true, call itemService.getItems, and set items on success', fakeAsync(() => {
      spyOn(itemService, 'getItems').and.returnValue(of(mockItems));
      component.isLoading = false;

      component.loadItems();
      expect(component.isLoading).toBeTrue();
      tick();

      expect(itemService.getItems).toHaveBeenCalledWith(component.searchQuery, component.minPrice, component.maxPrice);
      expect(component.items).toEqual(mockItems);
      expect(component.isLoading).toBeFalse();
    }));

    it('should handle error from itemService.getItems and set items to empty array', fakeAsync(() => {
      spyOn(itemService, 'getItems').and.returnValue(throwError(() => new Error('Service error')));
      spyOn(console, 'error');
      component.isLoading = false;

      component.loadItems();
      expect(component.isLoading).toBeTrue();
      tick();

      expect(console.error).toHaveBeenCalledWith('Error loading items:', jasmine.any(Error));
      expect(component.items).toEqual([]);
      expect(component.isLoading).toBeFalse();
    }));

    it('should log warning for 404 error', fakeAsync(() => {
      spyOn(itemService, 'getItems').and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
      spyOn(console, 'warn');
      component.loadItems();
      tick();
      expect(console.warn).toHaveBeenCalledWith('Items endpoint not found. Check if the backend server is running and the endpoint is correct');
      expect(component.items).toEqual([]);
      expect(component.isLoading).toBeFalse();
    }));
  });

  describe('refreshItems', () => {
    it('should call itemService.getItems and update items if not loading', fakeAsync(() => {
      const newMockItems = [{ ...mockItems[0], title: 'Updated Item 1' }];
      spyOn(itemService, 'getItems').and.returnValue(of(newMockItems));
      component.isLoading = false;
      component.items = mockItems; // Initial items

      component.refreshItems();
      tick();

      expect(itemService.getItems).toHaveBeenCalledWith(component.searchQuery, component.minPrice, component.maxPrice);
      expect(component.items).toEqual(newMockItems);
    }));

    it('should not call itemService.getItems if already loading', () => {
      spyOn(itemService, 'getItems');
      component.isLoading = true;
      component.refreshItems();
      expect(itemService.getItems).not.toHaveBeenCalled();
    });

    it('should handle error from itemService.getItems on refresh', fakeAsync(() => {
      spyOn(itemService, 'getItems').and.returnValue(throwError(() => new Error('Refresh error')));
      spyOn(console, 'error');
      component.isLoading = false;
      component.items = [...mockItems]; // Keep original items on refresh error

      component.refreshItems();
      tick();

      expect(console.error).toHaveBeenCalledWith('Error refreshing items:', jasmine.any(Error));
      expect(component.items).toEqual(mockItems); // Items should not change on refresh error
    }));
  });

  describe('onSearch', () => {
    it('should call loadItems', () => {
      spyOn(component, 'loadItems');
      component.onSearch();
      expect(component.loadItems).toHaveBeenCalled();
    });
  });

  describe('navigateToItem', () => {
    it('should call router.navigate with the correct item ID', () => {
      spyOn(router, 'navigate');
      const itemId = 'test-id';
      component.navigateToItem(itemId);
      expect(router.navigate).toHaveBeenCalledWith(['/items', itemId]);
    });
  });

  describe('isEndingSoon', () => {
    it('should return true if item ends within 24 hours', () => {
      const itemEndingSoon: AuctionItem = { ...mockItems[0], endTime: new Date(Date.now() + 10 * 3600 * 1000).toISOString() }; // 10 hours left
      expect(component.isEndingSoon(itemEndingSoon)).toBeTrue();
    });

    it('should return false if item ends after 24 hours', () => {
      const itemNotEndingSoon: AuctionItem = { ...mockItems[0], endTime: new Date(Date.now() + 30 * 3600 * 1000).toISOString() }; // 30 hours left
      expect(component.isEndingSoon(itemNotEndingSoon)).toBeFalse();
    });
  });

  describe('getTimeLeft', () => {
    it('should return "Auction ended" if endTime is in the past', () => {
      const endedItem: AuctionItem = { ...mockItems[0], endTime: new Date(Date.now() - 1000).toISOString() };
      expect(component.getTimeLeft(endedItem)).toBe('Auction ended');
    });

    it('should return days and hours if diff > 24 hours', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2); // 2 days
      futureDate.setHours(futureDate.getHours() + 5); // 5 hours
      const item: AuctionItem = { ...mockItems[0], endTime: futureDate.toISOString() };
      expect(component.getTimeLeft(item)).toMatch(/2d \d+h left/);
    });

    it('should return hours and minutes if diff < 24 hours and > 0 hours', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 5); // 5 hours
      futureDate.setMinutes(futureDate.getMinutes() + 30);
      const item: AuctionItem = { ...mockItems[0], endTime: futureDate.toISOString() };
      expect(component.getTimeLeft(item)).toMatch(/5h \d+m left/);
    });

    it('should return minutes if diff < 1 hour and > 0 minutes', () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 30);
      const item: AuctionItem = { ...mockItems[0], endTime: futureDate.toISOString() };
      // Depending on test execution speed, this might be 29m or 30m
      expect(component.getTimeLeft(item)).toMatch(/\d+m left/);
      expect(component.getTimeLeft(item)).not.toContain('h');
      expect(component.getTimeLeft(item)).not.toContain('d');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      fixture.detectChanges(); // Call ngOnInit to set up interval
      const nextSpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  it('should have currentUser$ observable from AuthService', (done) => {
    component.currentUser$.subscribe(user => {
      expect(user).toEqual({ id: 'user1', name: 'Test User', email: 'test@user.com' });
      done();
    });
  });
});
