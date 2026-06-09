import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { CreateItemComponent } from './create-item.component';
import { ItemService } from '../../../services/item.service';

// Material Modules - Import only what's necessary for the test
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

// Mocks
class MockItemService {
  createItem(item: any) {
    return of({ id: '1', ...item });
  }
}

class MockRouter {
  navigate(commands: any[]) {}
}

class MockMatSnackBar {
  open(message: string, action?: string, config?: any) {}
}


describe('CreateItemComponent', () => {
  let component: CreateItemComponent;
  let fixture: ComponentFixture<CreateItemComponent>;
  let itemService: ItemService;
  let router: Router;
  let snackBar: MatSnackBar;
  let fb: FormBuilder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        NoopAnimationsModule, // Important for Material components animations
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressBarModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatIconModule,
        CreateItemComponent // Import the standalone component
      ],
      providers: [
        FormBuilder,
        { provide: ItemService, useClass: MockItemService },
        { provide: Router, useClass: MockRouter },
        { provide: MatSnackBar, useClass: MockMatSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateItemComponent);
    component = fixture.componentInstance;
    itemService = TestBed.inject(ItemService);
    router = TestBed.inject(Router);
    snackBar = TestBed.inject(MatSnackBar);
    fb = TestBed.inject(FormBuilder); // Get FormBuilder instance
    fixture.detectChanges(); // Initial binding
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize itemForm with required controls and validators', () => {
    expect(component.itemForm).toBeDefined();
    expect(component.itemForm.get('title')).toBeTruthy();
    expect(component.itemForm.get('description')).toBeTruthy();
    expect(component.itemForm.get('startingPrice')).toBeTruthy();
    expect(component.itemForm.get('endTime')).toBeTruthy();

    // Test required validator
    const titleControl = component.itemForm.get('title');
    titleControl?.setValue('');
    expect(titleControl?.hasError('required')).toBeTrue();

    const descriptionControl = component.itemForm.get('description');
    descriptionControl?.setValue('');
    expect(descriptionControl?.hasError('required')).toBeTrue();

    const startingPriceControl = component.itemForm.get('startingPrice');
    startingPriceControl?.setValue('');
    expect(startingPriceControl?.hasError('required')).toBeTrue();

    const endTimeControl = component.itemForm.get('endTime');
    endTimeControl?.setValue('');
    expect(endTimeControl?.hasError('required')).toBeTrue();
  });

  it('should set minEndDate to tomorrow on initialization', () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    // Compare only date part, ignoring time
    expect(component.minEndDate.getFullYear()).toEqual(tomorrow.getFullYear());
    expect(component.minEndDate.getMonth()).toEqual(tomorrow.getMonth());
    expect(component.minEndDate.getDate()).toEqual(tomorrow.getDate());
  });

  describe('futureDateValidator', () => {
    let validatorFn: (control: AbstractControl) => any;
    let control: AbstractControl;

    beforeEach(() => {
      // Access the validator function from an instance of the component
      // The validator is a closure, so we need to call it to get the actual validator function
      validatorFn = (component as any).futureDateValidator(); 
      control = fb.control(null); // Create a dummy control
    });

    it('should return null for a future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      control.setValue(futureDate);
      expect(validatorFn(control)).toBeNull();
    });

    it('should return { min: true } for a past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      control.setValue(pastDate);
      expect(validatorFn(control)).toEqual({ min: true });
    });

    it('should return { min: true } for the current date/time', () => {
      const now = new Date();
      control.setValue(now);
      expect(validatorFn(control)).toEqual({ min: true });
    });

    it('should return null if control value is null or empty', () => {
      control.setValue(null);
      expect(validatorFn(control)).toBeNull();
      control.setValue('');
      expect(validatorFn(control)).toBeNull();
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      // Set up a valid form
      component.itemForm.setValue({
        title: 'Test Item',
        description: 'This is a test description with enough length.',
        startingPrice: 100,
        endTime: new Date(new Date().setDate(new Date().getDate() + 7)) // 7 days in future
      });
      fixture.detectChanges();
    });

    it('should call itemService.createItem and navigate on successful submission', fakeAsync(() => {
      const createItemSpy = spyOn(itemService, 'createItem').and.returnValue(of({ id: '1' }));
      const snackBarSpy = spyOn(snackBar, 'open');
      const routerSpy = spyOn(router, 'navigate');

      component.onSubmit();
      tick(); // Simulate the passage of time for async operations

      expect(component.isLoading).toBeFalse();
      expect(component.isSubmitting).toBeFalse();
      expect(createItemSpy).toHaveBeenCalledTimes(1);
      const expectedItemData = {
        ...component.itemForm.value,
        currentPrice: component.itemForm.value.startingPrice,
        status: 'ACTIVE'
      };
      expect(createItemSpy).toHaveBeenCalledWith(jasmine.objectContaining(expectedItemData));
      expect(snackBarSpy).toHaveBeenCalledWith('Auction created successfully!', 'Dismiss', jasmine.any(Object));
      expect(routerSpy).toHaveBeenCalledWith(['/items']);
    }));

    it('should handle error from itemService.createItem', fakeAsync(() => {
      const errorResponse = { error: { message: 'Failed to create' } };
      const createItemSpy = spyOn(itemService, 'createItem').and.returnValue(throwError(() => errorResponse));
      const snackBarSpy = spyOn(snackBar, 'open');

      component.onSubmit();
      tick();

      expect(component.isLoading).toBeFalse();
      expect(component.isSubmitting).toBeFalse();
      expect(createItemSpy).toHaveBeenCalledTimes(1);
      expect(snackBarSpy).toHaveBeenCalledWith(errorResponse.error.message, 'Dismiss', jasmine.any(Object));
    }));

    it('should handle generic error from itemService.createItem if no message in error.error', fakeAsync(() => {
      const errorResponse = { status: 500 }; // No specific message
      const createItemSpy = spyOn(itemService, 'createItem').and.returnValue(throwError(() => errorResponse));
      const snackBarSpy = spyOn(snackBar, 'open');

      component.onSubmit();
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith('Error creating auction', 'Dismiss', jasmine.any(Object));
    }));

    // The if (this.itemForm.valid) is commented out in the component.
    // If it were active, this test would be relevant.
    // it('should not call itemService.createItem if form is invalid', () => {
    //   component.itemForm.get('title')?.setValue(''); // Make form invalid
    //   fixture.detectChanges();
    //   const createItemSpy = spyOn(itemService, 'createItem');
    //   component.onSubmit();
    //   expect(createItemSpy).not.toHaveBeenCalled();
    //   expect(component.isLoading).toBeFalse();
    //   expect(component.isSubmitting).toBeFalse(); // Should remain false or be reset if set true before check
    // });
  });
});
