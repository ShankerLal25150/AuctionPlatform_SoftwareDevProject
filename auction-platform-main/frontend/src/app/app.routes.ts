import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/items/item-list/item-list.component').then(
        (m) => m.ItemListComponent
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'items',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/items/item-list/item-list.component').then(
            (m) => m.ItemListComponent
          ),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./components/items/create-item/create-item.component').then(
            (m) => m.CreateItemComponent
          ),
        canActivate: [AuthGuard],
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./components/items/item-detail/item-detail.component').then(
            (m) => m.ItemDetailComponent
          ),
      },
    ],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./components/profile/profile.component').then(
        (m) => m.ProfileComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
