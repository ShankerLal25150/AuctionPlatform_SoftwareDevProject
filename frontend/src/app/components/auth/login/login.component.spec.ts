import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { LoginComponent } from './login.component';
import { AuthService } from '../../../services/auth.service';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';

// Mocks
class MockAuthService {
  login(email: string, password: string) {
    if (email === 'test@example.com' && password === 'password') {
      return of({ token: 'fake-token', userId: '1' });
    }
    return throwError(() => new HttpErrorResponse({ error: { message: 'Invalid credentials' }, status: 401 }));
  }
}

class MockRouter {
  navigate(commands: any[]) {}
}

class MockMatSnackBar {
  open(message: string, action?: string, config?: any) {}
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let router: Router;
  let snackBar: MatSnackBar;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        NoopAnimationsModule,
        RouterModule.forRoot([]), // Required for routerLink
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressBarModule,
        MatIconModule,
        LoginComponent // Import standalone component
      ],
      providers: [
        FormBuilder,
        { provide: AuthService, useClass: MockAuthService },
        { provide: Router, useClass: MockRouter },
        { provide: MatSnackBar, useClass: MockMatSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    snackBar = TestBed.inject(MatSnackBar);
    fixture.detectChanges(); // Initial binding
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize loginForm with email and password controls', () => {
    expect(component.loginForm).toBeDefined();
    expect(component.loginForm.get('email')).toBeTruthy();
    expect(component.loginForm.get('password')).toBeTruthy();
  });

  it('email field should be required and validate email format', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('');
    expect(emailControl?.hasError('required')).toBeTrue();
    emailControl?.setValue('test');
    expect(emailControl?.hasError('email')).toBeTrue();
    emailControl?.setValue('test@example.com');
    expect(emailControl?.valid).toBeTrue();
  });

  it('password field should be required', () => {
    const passwordControl = component.loginForm.get('password');
    passwordControl?.setValue('');
    expect(passwordControl?.hasError('required')).toBeTrue();
    passwordControl?.setValue('password123');
    expect(passwordControl?.valid).toBeTrue();
  });

  describe('onSubmit', () => {
    it('should not call authService.login if form is invalid', () => {
      const loginSpy = spyOn(authService, 'login');
      component.loginForm.get('email')?.setValue(''); // Make form invalid
      component.onSubmit();
      expect(loginSpy).not.toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    });

    it('should call authService.login, show success snackbar, and navigate on valid submission', fakeAsync(() => {
      const loginSpy = spyOn(authService, 'login').and.returnValue(of({ token: 'token', userId: '1' }));
      const snackBarSpy = spyOn(snackBar, 'open');
      const routerSpy = spyOn(router, 'navigate');

      component.loginForm.setValue({ email: 'test@example.com', password: 'password' });
      component.onSubmit();
      tick(); // Simulate async operations

      expect(loginSpy).toHaveBeenCalledWith('test@example.com', 'password');
      expect(component.isLoading).toBeFalse();
      expect(snackBarSpy).toHaveBeenCalledWith('Login successful!', 'Close', jasmine.any(Object));
      expect(routerSpy).toHaveBeenCalledWith(['/']);
    }));

    it('should show error snackbar with API message on login failure (HttpErrorResponse with error.message)', fakeAsync(() => {
      const errorResponse = new HttpErrorResponse({ error: { message: 'Custom API error' }, status: 400 });
      spyOn(authService, 'login').and.returnValue(throwError(() => errorResponse));
      const snackBarSpy = spyOn(snackBar, 'open');

      component.loginForm.setValue({ email: 'wrong@example.com', password: 'wrong' });
      component.onSubmit();
      tick();

      expect(component.isLoading).toBeFalse();
      expect(snackBarSpy).toHaveBeenCalledWith('Custom API error', 'Close', jasmine.any(Object));
    }));

    it('should show "Invalid email or password" for 401 error', fakeAsync(() => {
      const errorResponse = new HttpErrorResponse({ status: 401 });
      spyOn(authService, 'login').and.returnValue(throwError(() => errorResponse));
      const snackBarSpy = spyOn(snackBar, 'open');

      component.loginForm.setValue({ email: 'test@example.com', password: 'wrongpassword' });
      component.onSubmit();
      tick();

      expect(component.isLoading).toBeFalse();
      expect(snackBarSpy).toHaveBeenCalledWith('Invalid email or password', 'Close', jasmine.any(Object));
    }));

    it('should show "Cannot connect to server" for status 0 error', fakeAsync(() => {
      const errorResponse = new HttpErrorResponse({ status: 0, statusText: 'Network Error' }); // Simulates network error
      spyOn(authService, 'login').and.returnValue(throwError(() => errorResponse));
      const snackBarSpy = spyOn(snackBar, 'open');

      component.loginForm.setValue({ email: 'test@example.com', password: 'password' });
      component.onSubmit();
      tick();

      expect(component.isLoading).toBeFalse();
      expect(snackBarSpy).toHaveBeenCalledWith('Cannot connect to server. Please try again later.', 'Close', jasmine.any(Object));
    }));

    it('should show generic "Login failed" for other HttpErrorResponse errors', fakeAsync(() => {
      const errorResponse = new HttpErrorResponse({ status: 500 }); // No specific message, not 401 or 0
      spyOn(authService, 'login').and.returnValue(throwError(() => errorResponse));
      const snackBarSpy = spyOn(snackBar, 'open');

      component.loginForm.setValue({ email: 'test@example.com', password: 'password' });
      component.onSubmit();
      tick();

      expect(component.isLoading).toBeFalse();
      expect(snackBarSpy).toHaveBeenCalledWith('Login failed', 'Close', jasmine.any(Object));
    }));

     it('should show generic "Login failed" for non-HttpErrorResponse errors', fakeAsync(() => {
      const errorResponse = new Error('Some generic error'); // Not an HttpErrorResponse
      spyOn(authService, 'login').and.returnValue(throwError(() => errorResponse));
      const snackBarSpy = spyOn(snackBar, 'open');

      component.loginForm.setValue({ email: 'test@example.com', password: 'password' });
      component.onSubmit();
      tick();

      expect(component.isLoading).toBeFalse();
      expect(snackBarSpy).toHaveBeenCalledWith('Login failed', 'Close', jasmine.any(Object));
    }));

    it('should set isLoading to true during submission and false after', fakeAsync(() => {
      spyOn(authService, 'login').and.returnValue(of({ token: 'token' }));
      component.loginForm.setValue({ email: 'test@example.com', password: 'password' });
      
      expect(component.isLoading).toBeFalse();
      component.onSubmit(); // This will set isLoading to true internally
      expect(component.isLoading).toBeTrue(); // Check immediately after calling onSubmit
      
      tick(); // Process async operations
      expect(component.isLoading).toBeFalse(); // Check after async operations complete
    }));
  });
});
