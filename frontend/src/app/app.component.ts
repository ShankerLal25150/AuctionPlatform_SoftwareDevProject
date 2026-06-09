/**
 * Main application component that serves as the root component for the auction application.
 * This component sets up the basic layout structure and imports necessary Angular modules.
 */
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { NavbarComponent } from './components/layout/navbar/navbar.component';

/**
 * @Component decorator that defines the root component configuration
 * @selector 'app-root' - The root component selector
 * @standalone true - Indicates this is a standalone component
 * @imports Array of imported modules and components required by this component
 * @template HTML template for the root component
 * @styles CSS styles for the root component layout
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    NavbarComponent,
  ],
  template: `
    <app-navbar></app-navbar>
    <div class="main-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [
    `
      .main-container {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }
    `,
  ],
})
export class AppComponent {
  /**
   * Application title that represents the name of the auction frontend
   */
  title = 'auction-frontend';
}
