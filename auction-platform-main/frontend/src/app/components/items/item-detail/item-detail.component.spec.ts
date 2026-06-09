import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, ParamMap, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject, ReplaySubject, BehaviorSubject, interval as rxjsInterval } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { ItemDetailComponent } from './item-detail.component';
import { ItemService } from '../../../services/item.service';
import { BidService } from '../../../services/bid.service';
import { AuthService } from '../../../services/auth.service';
import { AuctionItem } from '../../../models/item.model';
import { Bid } from '../../../models/bid.model';
import { User } from '../../../models/user.model';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';

// Mocks
export class ActivatedRouteStub {
  private subject = new ReplaySubject<ParamMap>();
  constructor(initialParams?: { [key: string]: string }) {
    this.setParamMap(initialParams);
  }
  readonly paramMap = this.subject.asObservable();
  setParamMap(params?: { [key: string]: string }) {
    this.subject.next(convertToParamMap(params));
  }
}

const mockItem: AuctionItem = {
  id: '123',
  title: 'Test Item',
  description: 'Test Description',
  startingPrice: 100,
  currentPrice: 150,
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Ends tomorrow
  imageUrl: 'http://example.com/image.jpg',
  sellerId: 'seller1',
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockBids: Bid[] = [
  { id: 'b1', itemId: '123', userId: 'user1', amount: 120, bidTime: new Date(Date.now() - 60000).toISOString() },
  { id: 'b2', itemId: '123', userId: 'user2', amount: 150, bidTime: new Date().toISOString() },
];

class MockItemService {
  getItem(id: string) { return of(mockItem); }
}

class MockBidService {
  getBidsByItem(itemId: string) { return of(mockBids); }
  placeBid(itemId: string, amount: number) { 
    return of({ id: 'newBid', itemId, userId: 'currentUser', amount, bidTime: new Date().toISOString() }); 
  }
}

class MockAuthService {
  currentUser$ = new BehaviorSubject<User | null>({ id: 'currentUser', name: 'Current User', email: 'current@user.com' });
}

class MockMatSnackBar {
  open(message: string, action?: string, config?: any) {}
}


describe('ItemDetailComponent', () => {
  let component: ItemDetailComponent;
  let fixture: ComponentFixture<ItemDetailComponent>;
  let activatedRoute: ActivatedRouteStub;
  let itemService: ItemService;
  let bidService: BidService;
  let authService: AuthService;
  let snackBar: MatSnackBar;

  beforeEach(async () => {
    activatedRoute = new ActivatedRouteStub({ id: '123' });

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        NoopAnimationsModule,
        RouterLink,
        MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, 
        MatInputModule, MatProgressBarModule, MatDividerModule, MatListModule,
        ItemDetailComponent // Standalone component
      ],
      providers: [
        FormBuilder,
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: ItemService, useClass: MockItemService },
        { provide: BidService, useClass: MockBidService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: MatSnackBar, useClass: MockMatSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemDetailComponent);
    component = fixture.componentInstance;
    itemService = TestBed.inject(ItemService);
    bidService = TestBed.inject(BidService);
    authService = TestBed.inject(AuthService);
    snackBar = TestBed.inject(MatSnackBar);
    // fixture.detectChanges(); // ngOnInit is called here, let's control it in tests
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load item and bids on init if itemId is present', fakeAsync(() => {
      spyOn(component as any, 'loadItemAndBids').and.callThrough();
      spyOn(itemService, 'getItem').and.returnValue(of(mockItem));
      spyOn(bidService, 'getBidsByItem').and.returnValue(of(mockBids));
      
      fixture.detectChanges(); // Triggers ngOnInit
      tick(); // Process observables

      expect((component as any).loadItemAndBids).toHaveBeenCalledWith('123');
      expect(component.item).toEqual(mockItem);
      expect(component.bids.length).toBe(mockBids.length);
      // interval subscription is also set up here, tested implicitly by refresh tests
    }));

    it('should not load data if itemId is not present', () => {
      activatedRoute.setParamMap({}); // No 'id' param
      spyOn(component as any, 'loadItemAndBids');
      fixture.detectChanges(); // ngOnInit
      expect((component as any).loadItemAndBids).not.toHaveBeenCalled();
    });

    it('should set up periodic refresh for item and bids', fakeAsync(() => {
      spyOn(component as any, 'refreshItemAndBids').and.callThrough();
      spyOn(itemService, 'getItem').and.returnValue(of({...mockItem, currentPrice: 160})); // Simulate price change
      spyOn(bidService, 'getBidsByItem').and.returnValue(of([...mockBids, {id: 'b3', itemId: '123', userId: 'user3', amount: 160, bidTime: new Date().toISOString()}]));

      fixture.detectChanges(); // ngOnInit
      tick(); // Initial load

      expect((component as any).refreshItemAndBids).not.toHaveBeenCalled(); // Not called immediately

      tick(10000); // Advance time by 10 seconds for the interval

      expect((component as any).refreshItemAndBids).toHaveBeenCalledWith('123');
      expect(component.item?.currentPrice).toBe(160);
      expect(component.bids.length).toBe(mockBids.length + 1);
      
      component.ngOnDestroy(); // Clean up interval
      flushMicrotasks();
    }));
  });

  describe('loadItemAndBids', () => {
    it('should load item and bids successfully', fakeAsync(() => {
      spyOn(itemService, 'getItem').and.returnValue(of(mockItem));
      spyOn(bidService, 'getBidsByItem').and.returnValue(of(mockBids));
      spyOn(component as any, 'updateBidFormValidation').and.callThrough();

      (component as any).loadItemAndBids('123');
      tick();

      expect(itemService.getItem).toHaveBeenCalledWith('123');
      expect(component.item).toEqual(mockItem);
      expect((component as any).updateBidFormValidation).toHaveBeenCalled();
      expect(bidService.getBidsByItem).toHaveBeenCalledWith('123');
      expect(component.bids.length).toBe(2);
      expect(component.bids[0].amount).toBe(150); // Sorted by bidTime desc
    }));

    it('should handle item load error', fakeAsync(() => {
      spyOn(itemService, 'getItem').and.returnValue(throwError(() => new Error('Item load error')));
      spyOn(snackBar, 'open');
      (component as any).loadItemAndBids('123');
      tick();
      expect(snackBar.open).toHaveBeenCalledWith('Error loading item details', 'Close', jasmine.any(Object));
    }));

    it('should handle invalid item data format', fakeAsync(() => {
      spyOn(itemService, 'getItem').and.returnValue(of('not an object' as any));
      spyOn(snackBar, 'open');
      (component as any).loadItemAndBids('123');
      tick();
      expect(snackBar.open).toHaveBeenCalledWith('Error: Invalid item data format', 'Close', jasmine.any(Object));
    }));

    it('should handle bids load error', fakeAsync(() => {
      spyOn(bidService, 'getBidsByItem').and.returnValue(throwError(() => new Error('Bids load error')));
      spyOn(snackBar, 'open');
      (component as any).loadItemAndBids('123'); // Item load will succeed
      tick();
      expect(snackBar.open).toHaveBeenCalledWith('Error loading bid history', 'Close', jasmine.any(Object));
    }));

     it('should handle invalid bids data format', fakeAsync(() => {
      spyOn(itemService, 'getItem').and.returnValue(of(mockItem)); // Item loads fine
      spyOn(bidService, 'getBidsByItem').and.returnValue(of('not an array' as any));
      (component as any).loadItemAndBids('123');
      tick();
      expect(component.bids).toEqual([]);
    }));
  });

  describe('refreshItemAndBids', () => {
    it('should refresh item and bids data', fakeAsync(() => {
      const updatedItem = { ...mockItem, currentPrice: 170 };
      const updatedBids = [ ...mockBids, { id: 'b3', itemId: '123', userId: 'user3', amount: 170, bidTime: new Date().toISOString() }];
      spyOn(itemService, 'getItem').and.returnValue(of(updatedItem));
      spyOn(bidService, 'getBidsByItem').and.returnValue(of(updatedBids));
      spyOn(component as any, 'updateBidFormValidation');

      component.item = mockItem; // Initial item state
      (component as any).refreshItemAndBids('123');
      tick();

      expect(itemService.getItem).toHaveBeenCalledWith('123');
      expect(component.item).toEqual(updatedItem);
      expect((component as any).updateBidFormValidation).toHaveBeenCalled();
      expect(bidService.getBidsByItem).toHaveBeenCalledWith('123');
      expect(component.bids.length).toBe(3);
    }));

    it('should log error on item refresh failure', fakeAsync(() => {
      spyOn(itemService, 'getItem').and.returnValue(throwError(() => new Error('Refresh failed')));
      spyOn(console, 'error');
      (component as any).refreshItemAndBids('123');
      tick();
      expect(console.error).toHaveBeenCalledWith('Error refreshing item:', jasmine.any(Error));
    }));

    it('should log error on bids refresh failure', fakeAsync(() => {
      spyOn(bidService, 'getBidsByItem').and.returnValue(throwError(() => new Error('Refresh failed')));
      spyOn(console, 'error');
      (component as any).refreshItemAndBids('123'); // Item refresh might succeed
      tick();
      expect(console.error).toHaveBeenCalledWith('Error refreshing bids:', jasmine.any(Error));
    }));
  });

  describe('updateBidFormValidation', () => {
    it('should set min validator for bid amount based on current item price', () => {
      component.item = mockItem; // currentPrice = 150
      (component as any).updateBidFormValidation();
      const amountControl = component.bidForm.get('amount');
      amountControl?.setValue(150); // Less than minBid (151)
      expect(amountControl?.hasError('min')).toBeTrue();
      amountControl?.setValue(151);
      expect(amountControl?.hasError('min')).toBeFalse();
    });

    it('should not fail if item is null', () => {
      component.item = null;
      expect(() => (component as any).updateBidFormValidation()).not.toThrow();
      const amountControl = component.bidForm.get('amount');
      // Should still have 'required' validator from constructor
      amountControl?.setValue('');
      expect(amountControl?.hasError('required')).toBeTrue();
      expect(amountControl?.hasError('min')).toBeFalse(); // No min validator if no item
    });
  });

  describe('onSubmitBid', () => {
    beforeEach(() => {
      component.item = { ...mockItem }; // currentPrice = 150
      fixture.detectChanges(); // To initialize form and apply validators
      (component as any).updateBidFormValidation(); // Ensure validators are set based on item
    });

    it('should not place bid if form is invalid', () => {
      spyOn(bidService, 'placeBid');
      component.bidForm.get('amount')?.setValue(''); // Invalid
      component.onSubmitBid();
      expect(bidService.placeBid).not.toHaveBeenCalled();
    });

    it('should not place bid if item is null', () => {
      spyOn(bidService, 'placeBid');
      component.item = null;
      component.bidForm.get('amount')?.setValue(200);
      component.onSubmitBid();
      expect(bidService.placeBid).not.toHaveBeenCalled();
    });

    it('should show snackbar and not place bid if bid amount is not higher than current price', () => {
      spyOn(bidService, 'placeBid');
      spyOn(snackBar, 'open');
      component.bidForm.get('amount')?.setValue(150); // Equal to current price
      component.onSubmitBid();
      expect(snackBar.open).toHaveBeenCalledWith('Bid must be higher than current price', 'Close', jasmine.any(Object));
      expect(bidService.placeBid).not.toHaveBeenCalled();
    });

    it('should place bid successfully, show snackbar, reset form, and refresh data', fakeAsync(() => {
      const placeBidSpy = spyOn(bidService, 'placeBid').and.returnValue(of({ id: 'newBid', itemId: '123', userId: 'user', amount: 160, bidTime: '' }));
      const snackBarSpy = spyOn(snackBar, 'open');
      const refreshSpy = spyOn(component as any, 'refreshItemAndBids');
      const formResetSpy = spyOn(component.bidForm, 'reset');

      component.bidForm.get('amount')?.setValue(160);
      component.onSubmitBid();
      
      expect(component.isPlacingBid).toBeTrue();
      tick(); // Process async placeBid

      expect(placeBidSpy).toHaveBeenCalledWith('123', 160);
      expect(formResetSpy).toHaveBeenCalled();
      expect(snackBarSpy).toHaveBeenCalledWith('Bid placed successfully!', 'Close', jasmine.any(Object));
      expect(refreshSpy).toHaveBeenCalledWith('123');
      expect(component.isPlacingBid).toBeFalse();
    }));

    it('should handle API error with error.error.message on bid placement', fakeAsync(() => {
      const error = new HttpErrorResponse({ error: { message: 'API error message' }, status: 400 });
      spyOn(bidService, 'placeBid').and.returnValue(throwError(() => error));
      spyOn(snackBar, 'open');
      spyOn(component as any, 'refreshItemAndBids');

      component.bidForm.get('amount')?.setValue(160);
      component.onSubmitBid();
      tick();

      expect(snackBar.open).toHaveBeenCalledWith('API error message', 'Close', jasmine.any(Object));
      expect((component as any).refreshItemAndBids).toHaveBeenCalledWith('123');
      expect(component.isPlacingBid).toBeFalse();
    }));

    it('should handle API error with string error.error on bid placement', fakeAsync(() => {
      const error = new HttpErrorResponse({ error: 'String error message', status: 400 });
      spyOn(bidService, 'placeBid').and.returnValue(throwError(() => error));
      spyOn(snackBar, 'open');
      spyOn(component as any, 'refreshItemAndBids');

      component.bidForm.get('amount')?.setValue(160);
      component.onSubmitBid();
      tick();

      expect(snackBar.open).toHaveBeenCalledWith('String error message', 'Close', jasmine.any(Object));
      expect((component as any).refreshItemAndBids).toHaveBeenCalledWith('123');
      expect(component.isPlacingBid).toBeFalse();
    }));

    it('should handle generic API error on bid placement', fakeAsync(() => {
      const error = new HttpErrorResponse({ status: 500 }); // No specific error message structure
      spyOn(bidService, 'placeBid').and.returnValue(throwError(() => error));
      spyOn(snackBar, 'open');
      spyOn(component as any, 'refreshItemAndBids');

      component.bidForm.get('amount')?.setValue(160);
      component.onSubmitBid();
      tick();

      expect(snackBar.open).toHaveBeenCalledWith('Error placing bid', 'Close', jasmine.any(Object));
      expect((component as any).refreshItemAndBids).toHaveBeenCalledWith('123');
      expect(component.isPlacingBid).toBeFalse();
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const nextSpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('isAuctionEnded', () => {
    it('should return true if item endTime is in the past', () => {
      const pastItem = { ...mockItem, endTime: new Date(Date.now() - 1000).toISOString() };
      expect(component.isAuctionEnded(pastItem)).toBeTrue();
    });
    it('should return false if item endTime is in the future', () => {
      const futureItem = { ...mockItem, endTime: new Date(Date.now() + 100000).toISOString() };
      expect(component.isAuctionEnded(futureItem)).toBeFalse();
    });
  });

  describe('getTimeLeft', () => {
    it('should return "Auction ended" if diff is <= 0', () => {
      const endedItem = { ...mockItem, endTime: new Date(Date.now() - 1000).toISOString() };
      expect(component.getTimeLeft(endedItem)).toBe('Auction ended');
    });
    it('should return days and hours if days > 0', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2); // 2 days from now
      futureDate.setHours(futureDate.getHours() + 3); // 3 hours from now
      const item = { ...mockItem, endTime: futureDate.toISOString() };
      expect(component.getTimeLeft(item)).toMatch(/2d \d+h left/);
    });
    it('should return hours and minutes if days = 0 and hours > 0', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 3); // 3 hours from now
      futureDate.setMinutes(futureDate.getMinutes() + 30);
      const item = { ...mockItem, endTime: futureDate.toISOString() };
      expect(component.getTimeLeft(item)).toMatch(/3h \d+m left/);
    });
    it('should return minutes if days = 0 and hours = 0', () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 30); // 30 minutes from now
      const item = { ...mockItem, endTime: futureDate.toISOString() };
      expect(component.getTimeLeft(item)).toBe('30m left'); // Or close to it, depending on execution time
    });
  });
});
