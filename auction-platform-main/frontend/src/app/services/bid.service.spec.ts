import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BidService } from './bid.service';
import { Bid } from '../models/bid.model';
import { environment } from '../../environments/environment';
import { AuctionItem } from '../models/item.model';

describe('BidService', () => {
  let service: BidService;
  let httpTestingController: HttpTestingController;
  const TEST_DATE = new Date('2025-06-08T10:00:00Z'); // Fixed date for testing

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BidService]
    });
    service = TestBed.inject(BidService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getBidsByItem', () => {
    it('should fetch bids for specific item', () => {
      const itemId = '1';
      const testItem: Partial<AuctionItem> = {
        id: itemId,
        title: 'Test Item'
      };
      
      const mockApiResponse = [{
        id: 1,
        amount: '100',
        bidTime: TEST_DATE.toISOString(),
        bidder: { id: 'user1', name: 'User 1', email: 'user1@test.com', role: 'USER' },
        item: testItem
      }];

      service.getBidsByItem(itemId).subscribe(bids => {
        expect(bids.length).toBe(1);
        expect(bids[0].amount).toBe(100);
        expect(bids[0].bidTime instanceof Date).toBeTrue();
        expect(bids[0].bidTime.toISOString()).toBe(TEST_DATE.toISOString());
      });

      const req = httpTestingController.expectOne(`${environment.apiBaseUrl}/bids/${itemId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockApiResponse);
    });

    it('should transform string amounts to numbers', () => {
      const itemId = '1';
      const testItem: Partial<AuctionItem> = {
        id: itemId,
        title: 'Test Item'
      };

      const mockApiResponse = [
        {
          id: 1,
          amount: '100.50',
          bidTime: TEST_DATE.toISOString(),
          bidder: { id: 'user1', name: 'User 1', email: 'user1@test.com', role: 'USER' },
          item: testItem
        },
        {
          id: 2,
          amount: '200.75',
          bidTime: TEST_DATE.toISOString(),
          bidder: { id: 'user2', name: 'User 2', email: 'user2@test.com', role: 'USER' },
          item: testItem
        }
      ];

      service.getBidsByItem(itemId).subscribe(bids => {
        expect(bids.length).toBe(2);
        expect(typeof bids[0].amount).toBe('number');
        expect(typeof bids[1].amount).toBe('number');
        expect(bids[0].amount).toBe(100.50);
        expect(bids[1].amount).toBe(200.75);
        bids.forEach(bid => {
          expect(bid.bidTime instanceof Date).toBeTrue();
          expect(bid.bidTime.toISOString()).toBe(TEST_DATE.toISOString());
        });
      });

      const req = httpTestingController.expectOne(`${environment.apiBaseUrl}/bids/${itemId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockApiResponse);
    });

    it('should transform dates and amounts correctly', () => {
      const now = new Date();
      const itemId = '1';
      const mockBids = [
        {
          id: 1,
          amount: '100.50',
          bidTime: now.toISOString(),
          bidder: { id: 'user1', name: 'User 1', email: 'user1@test.com', role: 'USER' }
        },
        {
          id: 2,
          amount: '200.75',
          bidTime: now.toISOString(),
          bidder: { id: 'user2', name: 'User 2', email: 'user2@test.com', role: 'USER' }
        }
      ];

      service.getBidsByItem(itemId).subscribe(bids => {
        expect(bids.length).toBe(2);

        // Test numeric conversions
        bids.forEach((bid, index) => {
          expect(typeof bid.amount).toBe('number');
          expect(bid.amount).toBe(parseFloat(mockBids[index].amount));
        });

        // Test date conversions
        bids.forEach(bid => {
          expect(bid.bidTime).toBeInstanceOf(Date);
          expect(bid.bidTime.getTime()).toBe(now.getTime());
        });
      });

      const req = httpTestingController.expectOne(`${environment.apiBaseUrl}/bids/${itemId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBids);
    });
  });

  describe('placeBid', () => {
    it('should place new bid and process response', () => {
      const itemId = '1';
      const amount = 150;
      const testItem: Partial<AuctionItem> = {
        id: itemId,
        title: 'Test Item'
      };

      const mockResponse = {
        id: 1,
        amount: amount.toString(),
        bidTime: TEST_DATE.toISOString(),
        bidder: { id: 'user1', name: 'User 1', email: 'user1@test.com', role: 'USER' },
        item: testItem
      };

      service.placeBid(itemId, amount).subscribe(bid => {
        expect(bid.amount).toBe(amount);
        expect(bid.bidTime instanceof Date).toBeTrue();
        expect(bid.bidTime.toISOString()).toBe(TEST_DATE.toISOString());
      });

      const req = httpTestingController.expectOne(`${environment.apiBaseUrl}/bids`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        itemId,
        amount: amount.toString()
      });
      req.flush(mockResponse);
    });

    it('should handle error response', () => {
      const itemId = '1';
      const amount = 150;
      const errorResponse = {
        status: 400,
        statusText: 'Bad Request',
        error: { message: 'Bid amount too low' }
      };

      service.placeBid(itemId, amount).subscribe({
        error: error => {
          expect(error.error.message).toBe('Bid amount too low');
        }
      });

      const req = httpTestingController.expectOne(`${environment.apiBaseUrl}/bids`);
      expect(req.request.method).toBe('POST');
      req.flush(errorResponse.error, errorResponse);
    });

    it('should handle decimal amounts correctly', () => {
      const itemId = '1';
      const amount = 150.75;
      const testItem: Partial<AuctionItem> = {
        id: itemId,
        title: 'Test Item'
      };

      const mockResponse = {
        id: 1,
        amount: amount.toString(),
        bidTime: TEST_DATE.toISOString(),
        bidder: { id: 'user1', name: 'User 1', email: 'user1@test.com', role: 'USER' },
        item: testItem
      };

      service.placeBid(itemId, amount).subscribe(bid => {
        expect(typeof bid.amount).toBe('number');
        expect(bid.amount).toBe(amount);
        expect(bid.bidTime instanceof Date).toBeTrue();
        expect(bid.bidTime.toISOString()).toBe(TEST_DATE.toISOString());
      });

      const req = httpTestingController.expectOne(`${environment.apiBaseUrl}/bids`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        itemId,
        amount: amount.toString()
      });
      req.flush(mockResponse);
    });
  });

  describe('getUserBids', () => {
    it('should fetch and filter bids for specific user', () => {
      const userId = 'user1';
      const testItem: Partial<AuctionItem> = {
        id: '1',
        title: 'Test Item'
      };

      const mockApiResponse = [
        {
          id: 1,
          amount: '100',
          bidTime: TEST_DATE.toISOString(),
          bidder: { id: userId, name: 'User 1', email: 'user1@test.com', role: 'USER' },
          item: testItem
        },
        {
          id: 2,
          amount: '200',
          bidTime: TEST_DATE.toISOString(),
          bidder: { id: 'user2', name: 'User 2', email: 'user2@test.com', role: 'USER' },
          item: testItem
        }
      ];

      service.getUserBids(userId).subscribe(bids => {
        expect(bids.length).toBe(1);
        expect(bids[0].bidder.id).toBe(userId);
        expect(bids[0].amount).toBe(100);
        expect(bids[0].bidTime instanceof Date).toBeTrue();
        expect(bids[0].bidTime.toISOString()).toBe(TEST_DATE.toISOString());
      });

      const req = httpTestingController.expectOne(`${environment.apiBaseUrl}/bids`);
      expect(req.request.method).toBe('GET');
      req.flush(mockApiResponse);
    });

    it('should handle empty response', () => {
      const userId = 'user1';

      service.getUserBids(userId).subscribe(bids => {
        expect(bids.length).toBe(0);
      });

      const req = httpTestingController.expectOne(`${environment.apiBaseUrl}/bids`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });
});
