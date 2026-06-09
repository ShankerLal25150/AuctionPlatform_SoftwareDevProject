/**
 * Component that handles creation of new auction items
 * Provides a form for users to list items for auction with validation
 */
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MatNativeDateModule } from '@angular/material/core';
import { ItemService } from '../../../services/item.service';

/**
 * @Component decorator that defines the create-item component configuration
 * @selector 'app-create-item' - Component selector
 * @standalone true - Indicates this is a standalone component
 * @imports Array of imported Angular modules required by this component
 * @templateUrl Component's HTML template
 * @styleUrls Component's SCSS styles
 */
@Component({
  selector: 'app-create-item',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    MatDatepickerModule,
    MatIconModule,
    RouterModule,
    MatNativeDateModule
  ],
  template: `
    <div class="create-item-container">
      <div class="create-item-content">
        <div class="create-item-header">
          <h1><mat-icon>add_circle</mat-icon> Create New Auction Item</h1>
          <p>Fill in the details below to list your item for auction</p>
        </div>

        <mat-card class="create-item-card">
          <mat-card-content>
            <form [formGroup]="itemForm" (ngSubmit)="onSubmit()">
              <div class="form-grid">
                <div class="form-col">
                  <mat-form-field appearance="outline">
                    <mat-label>Item Title</mat-label>
                    <mat-icon matPrefix>title</mat-icon>
                    <input matInput formControlName="title" placeholder="Vintage Watch" />
                    <mat-error *ngIf="itemForm.get('title')?.hasError('required')">
                      Title is required
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Description</mat-label>
                    <mat-icon matPrefix>description</mat-icon>
                    <textarea
                      matInput
                      formControlName="description"
                      rows="5"
                      placeholder="Provide a detailed description of your item..."
                    ></textarea>
                    <mat-error
                      *ngIf="itemForm.get('description')?.hasError('required')"
                    >
                      Description is required
                    </mat-error>
                  </mat-form-field>

                  <!-- <mat-form-field appearance="outline">
                    <mat-label>Image URL</mat-label>
                    <mat-icon matPrefix>image</mat-icon>
                    <input matInput formControlName="imageUrl" placeholder="https://example.com/image.jpg" />
                    <mat-error
                      *ngIf="itemForm.get('imageUrl')?.hasError('required')"
                    >
                      Image URL is required
                    </mat-error>
                  </mat-form-field> -->
                </div>

                <div class="form-col">
                  <mat-form-field appearance="outline">
                    <mat-label>Starting Price ($)</mat-label>
                    <mat-icon matPrefix>attach_money</mat-icon>
                    <input
                      matInput
                      formControlName="startingPrice"
                      type="number"
                      step="0.01"
                      placeholder="50.00"
                    />
                    <mat-error
                      *ngIf="itemForm.get('startingPrice')?.hasError('required')"
                    >
                      Starting price is required
                    </mat-error>
                    <mat-error
                      *ngIf="itemForm.get('startingPrice')?.hasError('min')"
                    >
                      Starting price must be greater than 0
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Auction End Date</mat-label>
                    <mat-icon matPrefix>event</mat-icon>
                    <input
                      matInput
                      [matDatepicker]="picker"
                      formControlName="endTime"
                      placeholder="MM/DD/YYYY"
                    />
                    <mat-datepicker-toggle
                      matSuffix
                      [for]="picker"
                    ></mat-datepicker-toggle>
                    <mat-datepicker #picker></mat-datepicker>
                    <mat-error
                      *ngIf="itemForm.get('endTime')?.hasError('required')"
                    >
                      End date is required
                    </mat-error>
                  </mat-form-field>

                  <div class="image-preview" *ngIf="itemForm.get('imageUrl')?.value">
                    <h3>Image Preview</h3>
                    <img [src]="itemForm.get('imageUrl')?.value" alt="Item preview" />
                  </div>
                </div>
              </div>

              <div class="form-actions">
                <button
                  mat-raised-button
                  color="accent"
                  type="button"
                  routerLink="/items"
                >
                  <mat-icon>arrow_back</mat-icon>
                  <span>Cancel</span>
                </button>
                <button
                  mat-raised-button
                  color="primary"
                  type="submit"
                >
                  <mat-icon *ngIf="!isLoading">publish</mat-icon>
                  <span>{{ isLoading ? 'Creating Item...' : 'Create Auction' }}</span>
                </button>
              </div>
            </form>
            <mat-progress-bar
              *ngIf="isLoading"
              mode="indeterminate"
            ></mat-progress-bar>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .create-item-container {
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
    }

    mat-card-header {
      margin-bottom: 1.5rem;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1rem;
    }

    textarea {
      min-height: 100px;
    }

    /* Custom datepicker styling */
    ::ng-deep .mat-datepicker-content {
      background-color: #ffffff;
      border-radius: var(--border-radius);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
      overflow: hidden;
    }

    ::ng-deep .mat-calendar {
      background-color: #f9f9fb;
      padding: 10px;
      border-radius: var(--border-radius);
    }

    ::ng-deep .mat-calendar-header {
      background-color: var(--primary-light);
      padding: 12px 8px;
      border-radius: var(--border-radius) var(--border-radius) 0 0;
    }

    ::ng-deep .mat-calendar-table-header {
      color: var(--text-secondary);
      font-weight: 500;
    }

    ::ng-deep .mat-calendar-body-cell-content {
      border-radius: 50%;
      height: 36px;
      width: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition);
    }

    ::ng-deep .mat-calendar-body-selected {
      background-color: var(--primary-color);
      color: white;
    }

    ::ng-deep .mat-calendar-body-today:not(.mat-calendar-body-selected) {
      border-color: var(--primary-color);
      color: var(--primary-color);
    }

    ::ng-deep .mat-calendar-body-cell:hover:not(.mat-calendar-body-disabled):not(.mat-calendar-body-selected) .mat-calendar-body-cell-content {
      background-color: var(--primary-light);
    }

    ::ng-deep .mat-datepicker-toggle .mat-icon-button {
      color: var(--primary-color);
    }

    @media (max-width: 600px) {
      .create-item-container {
        padding: 1rem;
      }

      ::ng-deep .mat-calendar-body-cell-content {
        height: 32px;
        width: 32px;
      }
    }
  `]
})
export class CreateItemComponent {
  /**
   * Form group that contains the item creation form controls
   * @type {FormGroup}
   */
  itemForm: FormGroup;

  /**
   * Flag indicating if the form submission is in progress
   * @type {boolean}
   */
  isSubmitting = false;

  /**
   * Loading state indicator for form submission
   * @type {boolean}
   */
  isLoading = false;

  /**
   * Minimum allowed end date for the auction
   * @type {Date}
   */
  minEndDate = new Date();

  /**
   * Component constructor that initializes dependencies and form
   * @param fb - Form builder for creating reactive forms
   * @param itemService - Service for handling item operations
   * @param router - Router for navigation
   * @param snackBar - Service for showing notifications
   */
  constructor(
    private fb: FormBuilder,
    private itemService: ItemService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    // Set minimum end date to tomorrow
    this.minEndDate.setDate(this.minEndDate.getDate() + 1);
    
    this.itemForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      startingPrice: ['', [Validators.required, Validators.min(0.01)]],
      endTime: ['', [Validators.required, this.futureDateValidator()]]
    });
  }

  /**
   * Custom validator that ensures the auction end date is in the future
   * @returns {ValidatorFn} - A validator function that returns ValidationErrors or null
   * @private
   */
  private futureDateValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const now = new Date();
      const inputDate = new Date(control.value);
      return inputDate > now ? null : { min: true };
    };
  }

  /**
   * Handles form submission
   * Creates a new auction item with the provided data
   * Shows success/error notifications and redirects on success
   */
  onSubmit(): void {
    // if (this.itemForm.valid) {
      this.isSubmitting = true;
      this.isLoading = true;
      const formValue = this.itemForm.value;
      
      const newItem = {
        ...formValue,
        currentPrice: formValue.startingPrice,
        status: 'ACTIVE'
      };
      console.log("new new",newItem);
      this.itemService.createItem(newItem).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.isLoading = false;
          this.snackBar.open('Auction created successfully!', 'Dismiss', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar', 'custom-snackbar']
          });
          this.router.navigate(['/items']);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.isLoading = false;
          this.snackBar.open(error.error.message || 'Error creating auction', 'Dismiss', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom',
            panelClass: ['error-snackbar', 'custom-snackbar']
          });
        }
      });
    // }
  }
}
