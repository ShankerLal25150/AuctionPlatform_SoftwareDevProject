import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ItemService } from './item.service';
import { AuctionItem, AuctionStatus } from '../models/item.model';
import { environment } from '../../environments/environment';

describe('ItemService', () => {
  let service: ItemService;
  let httpTestingController: HttpTestingController;
  const TEST_DATE = new Date('2025-06-08T10:00:00Z'); // Fixed date for testing
  const TEST_DATE_TOMORROW = new Date('2025-06-09T10:00:00Z');
  const TEST_DATE_YESTERDAY = new Date('2025-06-07T10:00:00Z');

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ItemService]
    });
    service = TestBed.inject(ItemService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify(); // Verify that no requests are outstanding
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getItem', () => {
    it('should fetch item by id', () => {
      const mockItem: AuctionItem = {
        id: '1',
        title: 'Test Item',
        description: 'Test Description',
        startingPrice: 100,
        currentPrice: 100,
        startTime: TEST_DATE,
        endTime: TEST_DATE_TOMORROW,
        status: 'ACTIVE',
        seller: { id: 'seller1', name: 'Seller', email: 'seller@test.com', role: 'USER' }
      };

      service.getItem('1').subscribe(item => {
        expect(item.id).toBe('1');
        expect(item.title).toBe('Test Item');
        expect(item.currentPrice).toBe(100);
        expect(item.startTime).toEqual(TEST_DATE);
        expect(item.endTime).toEqual(TEST_DATE_TOMORROW);
      });

      const req = httpTestingController.expectOne(`${environment.apiBaseUrl}/items/1`);
      expect(req.request.method).toBe('GET');
      req.flush({
        ...mockItem,
        startTime: mockItem.startTime.toISOString(),
        endTime: mockItem.endTime.toISOString()
      });
    });

    it('should process item details correctly', () => {
      const mockActiveItem: AuctionItem = {
        id: '1',
        title: 'Active Item',
        description: 'Test',
        startingPrice: 100,
        currentPrice: 150,
        startTime: TEST_DATE,
        endTime: TEST_DATE_TOMORROW,
        status: 'ACTIVE',
        seller: { id: 'seller1', name: 'Seller', email: 'seller@test.com', role: 'USER' },
        bids: [
          {
            id: 1,
            amount: 150,
            bidTime: TEST_DATE,
            bidder: { id: 'user1', name: 'User 1', email: 'user1@test.com', role: 'USER' },
            item: {} as AuctionItem
          }
        ]
      };

      service.getItem('1').subscribe(item => {
        expect(item.status).toBe('ACTIVE');
        expect(item.currentPrice).toBe(150);
        expect(item.bids![0].amount).toBe(150);
        expect(item.startTime).toEqual(TEST_DATE);
        expect(item.endTime).toEqual(TEST_DATE_TOMORROW);
        expect(item.bids![0].bidTime).toEqual(TEST_DATE);
      });

      const req = httpTestingController.expectOne(`${environment.apiBaseUrl}/items/1`);
      req.flush({
        ...mockActiveItem,
        startTime: mockActiveItem.startTime.toISOString(),
        endTime: mockActiveItem.endTime.toISOString(),
        bids: [
          {
            ...mockActiveItem.bids![0],
            bidTime: mockActiveItem.bids![0].bidTime.toISOString()
          }
        ]
      });
    });

    it('should transform string prices to numbers and handle dates', () => {
      const mockItem = {
        id: '1',
        title: 'Test Item',
        description: 'Test Description',
        startingPrice: '100.50',
        currentPrice: '150.75',
        startTime: TEST_DATE.toISOString(),
        endTime: TEST_DATE_TOMORROW.toISOString(),
        status: 'ACTIVE',
        seller: { id: 'seller1', name: 'Seller', email: 'seller@test.com', role: 'USER' },
        bids: [
          { 
            id: 1, 
            amount: '150.75', 
            bidTime: TEST_DATE.toISOString(), 
            bidder: { id: 'user1', name: 'User 1', email: 'user1@test.com', role: 'USER' },
            item: {} as AuctionItem 
          }
        ]
      };

      service.getItem('1').subscribe(item => {
        // Test numeric conversions
        expect(typeof item.startingPrice).toBe('number');
        expect(typeof item.currentPrice).toBe('number');
        expect(typeof item.bids![0].amount).toBe('number');
        expect(item.startingPrice).toBe(100.50);
        expect(item.currentPrice).toBe(150.75);
        expect(item.bids![0].amount).toBe(150.75);

        // Test date conversions
        expect(item.startTime).toBeInstanceOf(Date);
        expect(item.endTime).toBeInstanceOf(Date);
        expect(item.bids![0].bidTime).toBeInstanceOf(Date);
        expect(item.startTime.toISOString()).toBe(TEST_DATE.toISOString());
        expect(item.endTime.toISOString()).toBe(TEST_DATE_TOMORROW.toISOString());
        expect(item.bids![0].bidTime.toISOString()).toBe(TEST_DATE.toISOString());
      });

      const req = httpTestingController.expectOne(`${environment.apiBaseUrl}/items/1`);
      req.flush(mockItem);
    });
  });

  describe('createItem', () => {
    it('should create new item', () => {
      const newItem = {
        title: 'New Item',
        description: 'Description',
        startingPrice: 100,
        startTime: TEST_DATE,
        endTime: TEST_DATE_TOMORROW
      };

      service.createItem(newItem).subscribe(item => {
        expect(item.title).toBe('New Item');
        expect(item.startingPrice).toBe(100);
        expect(item.startTime).toEqual(TEST_DATE);
        expect(item.endTime).toEqual(TEST_DATE_TOMORROW);
      });

      const req = httpTestingController.expectOne(`${environment.apiBaseUrl}/items`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        ...newItem,
        startTime: newItem.startTime.toISOString(),
        endTime: newItem.endTime.toISOString()
      });
      req.flush({
        id: '1',
        ...newItem,
        startTime: newItem.startTime.toISOString(),
        endTime: newItem.endTime.toISOString()
      });
    });
  });

  describe('getItems', () => {
    it('should fetch items with filters', () => {
      const filters = {
        searchQuery: 'test',
        minPrice: 100,
        maxPrice: 200
      };

      const mockItems = [{
        id: '1',
        title: 'test item',
        startingPrice: 150,
        currentPrice: 150,
        startTime: TEST_DATE,
        endTime: TEST_DATE_TOMORROW,
        status: 'ACTIVE',
        seller: { id: 'seller1', name: 'Seller', email: 'seller@test.com', role: 'USER' }
      }];

      service.getItems(filters.searchQuery, filters.minPrice, filters.maxPrice).subscribe(items => {
        expect(items.length).toBe(1);
        expect(items[0].title).toContain('test');
        expect(items[0].startTime).toEqual(TEST_DATE);
        expect(items[0].endTime).toEqual(TEST_DATE_TOMORROW);
      });

      const req = httpTestingController.expectOne(
        `${environment.apiBaseUrl}/items?search=test&minPrice=100&maxPrice=200`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockItems.map(item => ({
        ...item,
        startTime: item.startTime.toISOString(),
        endTime: item.endTime.toISOString()
      })));
    });
  });

  describe('getUserItems', () => {
    it('should fetch items for specific user', () => {
      const userId = 'user1';
      const mockItems = [{
        id: '1',
        title: 'User Item',
        startTime: TEST_DATE,
        endTime: TEST_DATE_TOMORROW,
        status: 'ACTIVE',
        seller: { id: userId, name: 'User', email: 'user@test.com', role: 'USER' }
      }];

      service.getUserItems(userId).subscribe(items => {
        expect(items.length).toBe(1);
        expect(items[0].seller.id).toBe(userId);
        expect(items[0].startTime).toEqual(TEST_DATE);
        expect(items[0].endTime).toEqual(TEST_DATE_TOMORROW);
      });

      const req = httpTestingController.expectOne(`${environment.apiBaseUrl}/items?userId=${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockItems.map(item => ({
        ...item,
        startTime: item.startTime.toISOString(),
        endTime: item.endTime.toISOString()
      })));
    });
  });

  describe('updateItem', () => {
    it('should update existing item', () => {
      const itemId = '1';
      const updates = {
        title: 'Updated Title',
        description: 'Updated Description',
        startTime: TEST_DATE,
        endTime: TEST_DATE_TOMORROW
      };

      service.updateItem(itemId, updates).subscribe(item => {
        expect(item.title).toBe('Updated Title');
        expect(item.description).toBe('Updated Description');
        expect(item.startTime).toEqual(TEST_DATE);
        expect(item.endTime).toEqual(TEST_DATE_TOMORROW);
      });

      const req = httpTestingController.expectOne(`${environment.apiBaseUrl}/items/${itemId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        ...updates,
        startTime: updates.startTime.toISOString(),
        endTime: updates.endTime.toISOString()
      });
      req.flush({
        id: itemId,
        ...updates,
        startTime: updates.startTime.toISOString(),
        endTime: updates.endTime.toISOString()
      });
    });
  });
});
