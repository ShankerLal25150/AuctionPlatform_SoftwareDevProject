/**
 * Component that handles user login functionality
 * Provides a form for users to enter their credentials and sign in
 */
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * @Component decorator that defines the login component configuration
 * @selector 'app-login' - Component selector
 * @standalone true - Indicates this is a standalone component
 * @imports Array of imported Angular modules required by this component
 * @templateUrl Component's HTML template
 * @styleUrls Component's SCSS styles
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
  ],
  template: `
    <div class="login-container">
      <div class="login-content">
        <div class="login-left">
          <div class="login-brand">
            <span class="logo">🏆</span>
            <h1>Auction Hub</h1>
          </div>
          <div class="login-info">
            <h2>Welcome Back</h2>
            <p>Sign in to continue to your account and manage your auctions</p>
          </div>
        </div>

        <mat-card class="login-card">
          <mat-card-header>
            <mat-card-title>Sign In</mat-card-title>
            <mat-card-subtitle>Enter your credentials to access your account</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <mat-icon matPrefix>email</mat-icon>
                <input matInput formControlName="email" type="email" placeholder="your.email@example.com" />
                <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                  Email is required
                </mat-error>
                <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                  Please enter a valid email
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Password</mat-label>
                <mat-icon matPrefix>lock</mat-icon>
                <input matInput formControlName="password" type="password" placeholder="••••••••" />
                <mat-error
                  *ngIf="loginForm.get('password')?.hasError('required')"
                >
                  Password is required
                </mat-error>
              </mat-form-field>

              <div class="form-actions">
                <button
                  mat-raised-button
                  color="primary"
                  type="submit"
                  [disabled]="loginForm.invalid || isLoading"
                >
                  <mat-icon *ngIf="!isLoading">login</mat-icon>
                  <span>{{ isLoading ? 'Signing in...' : 'Sign In' }}</span>
                </button>
              </div>
            </form>
            <mat-progress-bar
              *ngIf="isLoading"
              mode="indeterminate"
            ></mat-progress-bar>
            
            <div class="login-footer">
              <p>Don't have an account? <a routerLink="/register">Register now</a></p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: calc(100vh - 70px);
        background: linear-gradient(135deg, var(--primary-light) 0%, #ffffff 100%);
        padding: 2rem;
      }

      .login-content {
        display: flex;
        max-width: 1000px;
        width: 100%;
        box-shadow: var(--box-shadow);
        border-radius: var(--border-radius);
        overflow: hidden;
        background-color: white;
      }

      .login-left {
        flex: 1;
        background: linear-gradient(135deg, #1a3a6c 0%, #0d2249 100%);
        color: white;
        padding: 3rem 2rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .login-brand {
        display: flex;
        align-items: center;
        margin-bottom: 2rem;
      }

      .login-brand .logo {
        font-size: 2.5rem;
        margin-right: 1rem;
      }

      .login-brand h1 {
        font-size: 2rem;
        font-weight: 600;
        margin: 0;
      }

      .login-info h2 {
        font-size: 1.8rem;
        font-weight: 300;
        margin-bottom: 1rem;
      }

      .login-info p {
        font-size: 1rem;
        opacity: 0.8;
        line-height: 1.6;
      }

      .login-card {
        flex: 1;
        border-radius: 0;
        box-shadow: none;
        padding: 1rem;
      }

      mat-card-header {
        margin-bottom: 1.5rem;
        padding: 1rem 1rem 0;
      }

      mat-card-title {
        font-size: 1.8rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
        color: var(--text-primary);
      }

      mat-card-subtitle {
        color: var(--text-secondary);
        font-size: 1rem;
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 0 1rem;
      }

      mat-form-field {
        width: 100%;
      }

      .form-actions {
        display: flex;
        justify-content: center;
        margin-top: 1.5rem;
      }

      button {
        width: 100%;
        padding: 0.75rem;
        font-size: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: var(--transition);
      }

      button:hover:not([disabled]) {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
      }

      .login-footer {
        text-align: center;
        margin-top: 2rem;
        color: var(--text-secondary);
      }

      .login-footer a {
        color: var(--primary-color);
        text-decoration: none;
        font-weight: 500;
        transition: var(--transition);
      }

      .login-footer a:hover {
        color: var(--primary-dark);
        text-decoration: underline;
      }

      @media (max-width: 768px) {
        .login-content {
          flex-direction: column;
        }

        .login-left {
          padding: 2rem 1.5rem;
        }
      }
    `,
  ],
})
export class LoginComponent {
  /**
   * Form group that contains the login form controls
   * @type {FormGroup}
   */
  loginForm: FormGroup;

  /**
   * Loading state indicator for login operation
   * @type {boolean}
   */
  isLoading = false;

  /**
   * Component constructor that initializes dependencies and form
   * @param fb - Form builder for creating reactive forms
   * @param authService - Service for handling authentication
   * @param router - Router for navigation
   * @param snackBar - Service for showing notifications
   */
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  /**
   * Handles form submission
   * Attempts to log in with the provided credentials
   * Shows success/error notifications and redirects on success
   */
  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Login successful!', 'Close', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/']);
        },
        error: (error: unknown) => {
          this.isLoading = false;
          let errorMessage = 'Login failed';

          if (error instanceof HttpErrorResponse) {
            // Handle API error responses
            if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.status === 401) {
              errorMessage = 'Invalid email or password';
            } else if (error.status === 0) {
              errorMessage = 'Cannot connect to server. Please try again later.';
            }
          }

          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: ['error-snackbar']
          });

          console.error('Login error:', error);
        },
      });
    }
  }
}
