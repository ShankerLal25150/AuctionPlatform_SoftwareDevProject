import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { RegisterComponent } from './register.component';
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
  register(name: string, email: string, password: string) {
    if (email === 'test@example.com') {
      return of({ id: '1', name, email });
    }
    return throwError(() => new HttpErrorResponse({ error: { message: 'Email already exists' }, status: 400 }));
  }
  // Add a login method if your component/service uses it after registration
  // For now, assuming register is the only method called from this component
}

class MockRouter {
  navigate(commands: any[]) {}
}

class MockMatSnackBar {
  open(message: string, action?: string, config?: any) {}
}

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: AuthService;
  let router: Router;
  let snackBar: MatSnackBar;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        NoopAnimationsModule,
        RouterModule.forRoot([]), // For routerLink
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressBarModule,
        MatIconModule,
        RegisterComponent // Import standalone component
      ],
      providers: [
        FormBuilder,
        { provide: AuthService, useClass: MockAuthService },
        { provide: Router, useClass: MockRouter },
        { provide: MatSnackBar, useClass: MockMatSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    snackBar = TestBed.inject(MatSnackBar);
    fixture.detectChanges(); // Initial binding
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize registerForm with name, email, and password controls', () => {
    expect(component.registerForm).toBeDefined();
    expect(component.registerForm.get('name')).toBeTruthy();
    expect(component.registerForm.get('email')).toBeTruthy();
    expect(component.registerForm.get('password')).toBeTruthy();
  });

  it('name field should be required', () => {
    const nameControl = component.registerForm.get('name');
    nameControl?.setValue('');
    expect(nameControl?.hasError('required')).toBeTrue();
    nameControl?.setValue('Test User');
    expect(nameControl?.valid).toBeTrue();
  });

  it('email field should be required and validate email format', () => {
    const emailControl = component.registerForm.get('email');
    emailControl?.setValue('');
    expect(emailControl?.hasError('required')).toBeTrue();
    emailControl?.setValue('test');
    expect(emailControl?.hasError('email')).toBeTrue();
    emailControl?.setValue('test@example.com');
    expect(emailControl?.valid).toBeTrue();
  });

  it('password field should be required and have minlength validation', () => {
    const passwordControl = component.registerForm.get('password');
    passwordControl?.setValue('');
    expect(passwordControl?.hasError('required')).toBeTrue();
    passwordControl?.setValue('123');
    expect(passwordControl?.hasError('minlength')).toBeTrue();
    passwordControl?.setValue('password123');
    expect(passwordControl?.valid).toBeTrue();
  });

  describe('onSubmit', () => {
    it('should not call authService.register if form is invalid', () => {
      const registerSpy = spyOn(authService, 'register');
      component.registerForm.get('email')?.setValue(''); // Make form invalid
      component.onSubmit();
      expect(registerSpy).not.toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    });

    it('should call authService.register, show success snackbar, and navigate on valid submission', fakeAsync(() => {
      const registerSpy = spyOn(authService, 'register').and.returnValue(of({ id: '1', name: 'Test User', email: 'test@example.com' }));
      const snackBarSpy = spyOn(snackBar, 'open');
      const routerSpy = spyOn(router, 'navigate');

      component.registerForm.setValue({ name: 'Test User', email: 'test@example.com', password: 'password123' });
      component.onSubmit();
      tick(); // Simulate async operations

      expect(registerSpy).toHaveBeenCalledWith('Test User', 'test@example.com', 'password123');
      expect(component.isLoading).toBeFalse();
      expect(snackBarSpy).toHaveBeenCalledWith('Account created successfully! Welcome to Auction Hub.', 'Dismiss', jasmine.any(Object));
      expect(routerSpy).toHaveBeenCalledWith(['/']); // Navigates to home
    }));

    it('should show error snackbar with API message on registration failure', fakeAsync(() => {
      const errorResponse = new HttpErrorResponse({ error: { message: 'Email already in use' }, status: 400 });
      spyOn(authService, 'register').and.returnValue(throwError(() => errorResponse));
      const snackBarSpy = spyOn(snackBar, 'open');

      component.registerForm.setValue({ name: 'Test User', email: 'existing@example.com', password: 'password123' });
      component.onSubmit();
      tick();

      expect(component.isLoading).toBeFalse();
      expect(snackBarSpy).toHaveBeenCalledWith('Registration failed: Email already in use', 'Dismiss', jasmine.any(Object));
    }));

    it('should show generic error message if API error message is missing', fakeAsync(() => {
      const errorResponse = new HttpErrorResponse({ error: {}, status: 500 }); // No message field
      spyOn(authService, 'register').and.returnValue(throwError(() => errorResponse));
      const snackBarSpy = spyOn(snackBar, 'open');

      component.registerForm.setValue({ name: 'Test User', email: 'error@example.com', password: 'password123' });
      component.onSubmit();
      tick();

      expect(component.isLoading).toBeFalse();
      expect(snackBarSpy).toHaveBeenCalledWith('Registration failed: An error occurred', 'Dismiss', jasmine.any(Object));
    }));

    it('should set isLoading to true during submission and false after', fakeAsync(() => {
      spyOn(authService, 'register').and.returnValue(of({ id: '1' }));
      component.registerForm.setValue({ name: 'Test User', email: 'test@example.com', password: 'password123' });
      
      expect(component.isLoading).toBeFalse();
      component.onSubmit();
      expect(component.isLoading).toBeTrue();
      
      tick(); // Process async operations
      expect(component.isLoading).toBeFalse();
    }));
  });
});
