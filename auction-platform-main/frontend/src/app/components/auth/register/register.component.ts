/**
 * Component that handles user registration functionality
 * Provides a form for users to create new accounts
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
import { RouterModule } from '@angular/router';

/**
 * @Component decorator that defines the register component configuration
 * @selector 'app-register' - Component selector
 * @standalone true - Indicates this is a standalone component
 * @imports Array of imported Angular modules required by this component
 * @templateUrl Component's HTML template
 * @styleUrls Component's SCSS styles
 */
@Component({
  selector: 'app-register',
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
    RouterModule
  ],
  template: `
    <div class="register-container">
      <div class="register-content">
        <div class="register-left">
          <div class="register-brand">
            <span class="logo">🏆</span>
            <h1>Auction Hub</h1>
          </div>
          <div class="register-info">
            <h2>Join Our Community</h2>
            <p>Create an account to start bidding on exclusive items or sell your own treasures</p>
          </div>
        </div>

        <mat-card class="register-card">
          <mat-card-header>
            <mat-card-title>Create Account</mat-card-title>
            <mat-card-subtitle>Fill in your details to get started</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline">
                <mat-label>Full Name</mat-label>
                <mat-icon matPrefix>person</mat-icon>
                <input matInput formControlName="name" placeholder="John Doe" />
                <mat-error
                  *ngIf="registerForm.get('name')?.hasError('required')"
                >
                  Name is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Email Address</mat-label>
                <mat-icon matPrefix>email</mat-icon>
                <input matInput formControlName="email" type="email" placeholder="your.email@example.com" />
                <mat-error
                  *ngIf="registerForm.get('email')?.hasError('required')"
                >
                  Email is required
                </mat-error>
                <mat-error *ngIf="registerForm.get('email')?.hasError('email')">
                  Please enter a valid email
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Password</mat-label>
                <mat-icon matPrefix>lock</mat-icon>
                <input matInput formControlName="password" type="password" placeholder="••••••••" />
                <mat-error
                  *ngIf="registerForm.get('password')?.hasError('required')"
                >
                  Password is required
                </mat-error>
                <mat-error
                  *ngIf="registerForm.get('password')?.hasError('minlength')"
                >
                  Password must be at least 6 characters
                </mat-error>
              </mat-form-field>

              <div class="form-actions">
                <button
                  mat-raised-button
                  color="primary"
                  type="submit"
                  [disabled]="registerForm.invalid || isLoading"
                >
                  <mat-icon *ngIf="!isLoading">how_to_reg</mat-icon>
                  <span>{{ isLoading ? 'Creating Account...' : 'Create Account' }}</span>
                </button>
              </div>
            </form>
            <mat-progress-bar
              *ngIf="isLoading"
              mode="indeterminate"
            ></mat-progress-bar>
            
            <div class="register-footer">
              <p>Already have an account? <a routerLink="/login">Sign in</a></p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .register-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: calc(100vh - 70px);
        background: linear-gradient(135deg, var(--accent-light) 0%, #ffffff 100%);
        padding: 2rem;
      }

      .register-content {
        display: flex;
        max-width: 1000px;
        width: 100%;
        box-shadow: var(--box-shadow);
        border-radius: var(--border-radius);
        overflow: hidden;
        background-color: white;
      }

      .register-left {
        flex: 1;
        background: linear-gradient(135deg, var(--accent-color) 0%, var(--accent-dark) 100%);
        color: white;
        padding: 3rem 2rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
    

      .register-brand {
        display: flex;
        align-items: center;
        margin-bottom: 2rem;
      }

      .register-brand .logo {
        font-size: 2.5rem;
        margin-right: 1rem;
      }

      .register-brand h1 {
        font-size: 2rem;
        font-weight: 600;
        margin: 0;
      }

      .register-info h2 {
        font-size: 1.8rem;
        font-weight: 300;
        margin-bottom: 1rem;
      }

      .register-info p {
        font-size: 1rem;
        opacity: 0.8;
        line-height: 1.6;
      }

      .register-card {
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

      .register-footer {
        text-align: center;
        margin-top: 2rem;
        color: var(--text-secondary);
      }

      .register-footer a {
        color: var(--accent-color);
        text-decoration: none;
        font-weight: 500;
        transition: var(--transition);
      }

      .register-footer a:hover {
        color: var(--accent-dark);
        text-decoration: underline;
      }

      @media (max-width: 768px) {
        .register-content {
          flex-direction: column;
        }

        .register-left {
          padding: 2rem 1.5rem;
        }
      }
    `,
  ],
})
/**
 * Register component class
 */
export class RegisterComponent {
  /**
   * Form group that contains the registration form controls
   * @type {FormGroup}
   */
  registerForm: FormGroup;

  /**
   * Loading state indicator for registration operation
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
  ) {    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  /**
   * Handles form submission
   * Attempts to register a new user with the provided credentials
   * Shows success/error notifications and redirects on success
   */
  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      const { name, email, password } = this.registerForm.value;

      this.authService.register(name, email, password).subscribe({
        next: (user) => {
          this.isLoading = false;
          this.snackBar.open(
            'Account created successfully! Welcome to Auction Hub.',
            'Dismiss',
            {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'bottom',
              panelClass: ['success-snackbar', 'custom-snackbar']
            }
          );
          // Redirect to home page instead of login page
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open(
            `Registration failed: ${error.error?.message || 'An error occurred'}`,
            'Dismiss',
            {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'bottom',
              panelClass: ['error-snackbar', 'custom-snackbar']
            }
          );
        },
      });
    }
  }
}
