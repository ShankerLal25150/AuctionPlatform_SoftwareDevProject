import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { NgIf, AsyncPipe } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of, Subject } from 'rxjs';

import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';

// Material Modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';

// Mocks
const mockUser: User = {
  id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  // role: 'SELLER', // Keep commented to test default behavior first, then can add
  profilePicture: 'test.jpg'
};

class MockAuthService {
  currentUser$ = new BehaviorSubject<User | null>(null);
  isLoggedInValue = false;

  constructor() {
    // Simulate initial logged-out state
    this.currentUser$.next(null);
  }

  logout(): void {
    this.currentUser$.next(null);
    this.isLoggedInValue = false;
  }

  isLoggedIn(): boolean {
    return this.isLoggedInValue;
  }

  getToken(): string | null {
    return this.isLoggedInValue ? 'fake-token' : null;
  }

  // Helper to simulate login for tests
  simulateLogin(user: User): void {
    this.currentUser$.next(user);
    this.isLoggedInValue = true;
  }
}

class MockRouter {
  navigate(commands: any[]) {
    return Promise.resolve(true);
  }
}

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authService: MockAuthService;
  let router: MockRouter;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NgIf, RouterLink, RouterModule,
        NoopAnimationsModule,
        MatToolbarModule, MatButtonModule, MatMenuModule, MatIconModule,
        MatProgressBarModule, MatDividerModule,
        NavbarComponent // Standalone component
      ],
      providers: [
        { provide: AuthService, useClass: MockAuthService },
        { provide: Router, useClass: MockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService; // Cast to mock type
    router = TestBed.inject(Router) as unknown as MockRouter;
    // fixture.detectChanges(); // ngOnInit is called here, control in tests
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should subscribe to currentUser$ and update currentUser', () => {
      expect(component.currentUser).toBeNull();
      authService.simulateLogin(mockUser);
      fixture.detectChanges(); // Triggers ngOnInit and subscription
      expect(component.currentUser).toEqual(mockUser);
    });

    it('should update currentUser when auth state changes', () => {
      fixture.detectChanges(); // Initial state (logged out)
      expect(component.currentUser).toBeNull();

      authService.simulateLogin(mockUser);
      // No fixture.detectChanges() needed here as the subscription is already active
      expect(component.currentUser).toEqual(mockUser);

      authService.logout();
      expect(component.currentUser).toBeNull();
    });
  });

  describe('logout', () => {
    it('should set isLoading to true, call authService.logout, navigate to /login, and set isLoading to false', fakeAsync(() => {
      authService.simulateLogin(mockUser);
      fixture.detectChanges();
      spyOn(authService, 'logout').and.callThrough();
      spyOn(router, 'navigate').and.callThrough();

      component.logout();
      expect(component.isLoading).toBeTrue();

      tick(); // Allow promises (like router.navigate) to resolve

      expect(authService.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      expect(component.currentUser).toBeNull();
      expect(component.isLoading).toBeFalse();
    }));
  });

  describe('isSeller and isBuyer', () => {
    // Current implementation always returns true, so tests reflect that.
    // If role-based logic is added, these tests would need to change.
    it('isSeller() should return true (current implementation)', () => {
      expect(component.isSeller()).toBeTrue();
    });

    it('isBuyer() should return true (current implementation)', () => {
      expect(component.isBuyer()).toBeTrue();
    });

    // Example of how it might be tested if roles were implemented:
    xit('isSeller() should return true if user role is SELLER', () => {
      const sellerUser = { ...mockUser, role: 'SELLER' as any }; // Assuming role property
      authService.simulateLogin(sellerUser);
      fixture.detectChanges();
      // expect(component.isSeller()).toBeTrue();
    });
  });

  describe('isLoggedIn', () => {
    it('should return true if authService.isLoggedIn() is true', () => {
      spyOn(authService, 'isLoggedIn').and.returnValue(true);
      expect(component.isLoggedIn()).toBeTrue();
    });

    it('should return false if authService.isLoggedIn() is false', () => {
      spyOn(authService, 'isLoggedIn').and.returnValue(false);
      expect(component.isLoggedIn()).toBeFalse();
    });
  });

  describe('getUserInitials', () => {
    it('should return "U" if currentUser or name is null/undefined', () => {
      component.currentUser = null;
      expect(component.getUserInitials()).toBe('U');
      component.currentUser = { ...mockUser, name: undefined as any };
      expect(component.getUserInitials()).toBe('U');
    });

    it('should return the first letter if name has one part', () => {
      component.currentUser = { ...mockUser, name: 'Test' };
      expect(component.getUserInitials()).toBe('T');
    });

    it('should return initials of first two parts if name has multiple parts', () => {
      component.currentUser = { ...mockUser, name: 'Test User Example' };
      expect(component.getUserInitials()).toBe('TU');
    });
  });
  
  describe('getUserRole', () => {
    it('should return "Seller" if isSeller() is true', () => {
      spyOn(component, 'isSeller').and.returnValue(true);
      expect(component.getUserRole()).toBe('Seller');
    });

    it('should return "Buyer" if isSeller() is false', () => {
      spyOn(component, 'isSeller').and.returnValue(false);
      expect(component.getUserRole()).toBe('Buyer');
    });
  });

  describe('Mobile Menu', () => {
    it('toggleMobileMenu() should toggle isMobileMenuOpen', () => {
      expect(component.isMobileMenuOpen).toBeFalse();
      component.toggleMobileMenu();
      expect(component.isMobileMenuOpen).toBeTrue();
      component.toggleMobileMenu();
      expect(component.isMobileMenuOpen).toBeFalse();
    });

    it('closeMobileMenu() should set isMobileMenuOpen to false', () => {
      component.isMobileMenuOpen = true;
      component.closeMobileMenu();
      expect(component.isMobileMenuOpen).toBeFalse();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      fixture.detectChanges(); // ngOnInit
      const destroySubject = (component as any).destroy$ as Subject<void>;
      spyOn(destroySubject, 'next').and.callThrough();
      spyOn(destroySubject, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(destroySubject.next).toHaveBeenCalled();
      expect(destroySubject.complete).toHaveBeenCalled();
    });
  });
});
