/**
 * Service that handles authentication-related operations for the auction application.
 * Manages user login, registration, logout, and authentication state.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, switchMap, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

/**
 * Interface for token response from authentication endpoints
 */
interface TokenResponse {
  access_token: string;
}

/**
 * @Injectable decorator that marks this service as available for dependency injection
 * @providedIn 'root' - Service is provided at the root level
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /**
   * Key used to store authentication token in localStorage
   * @private
   */
  private readonly TOKEN_KEY = 'auth_token';

  /**
   * Key used to store user data in localStorage
   * @private
   */
  private readonly USER_KEY = 'user';

  /**
   * API endpoints configuration
   * @private
   */
  private readonly API_PATH = {
    login: '/users/login',
    register: '/users/register',
    logout: '/users/logout',
    profile: '/users/profile'
  };
  
  /**
   * Behavior subject that holds the current user state
   * @private
   */
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  /**
   * Observable that emits the current user state
   */
  currentUser$ = this.currentUserSubject.asObservable();

  /**
   * Constructor initializes the authentication service
   * @param http - HttpClient instance for making HTTP requests
   */
  constructor(private http: HttpClient) {
    this.initializeAuthState();
  }

  /**
   * Initializes the authentication state by checking for existing token and user data
   * @private
   */
  private initializeAuthState(): void {
    try {
      const token = this.getToken();
      const user = localStorage.getItem(this.USER_KEY);
      
      if (!token || !user) {
        this.logout();
        return;
      }

      const parsedUser = JSON.parse(user);
      if (this.isValidUser(parsedUser)) {
        this.currentUserSubject.next(parsedUser);
      } else {
        this.logout();
      }
    } catch (error) {
      console.error('Error initializing auth state:', error);
      this.logout();
    }
  }

  login(email: string, password: string): Observable<User> {
    const url = `${environment.apiBaseUrl}${this.API_PATH.login}`;
    return this.http.post<any>(url, { email, password }).pipe(
      switchMap(response => {
        // Handle different response formats
        const token = response.access_token || response.token || response.accessToken;
        
        if (!token) {
          console.error('Login response format:', response);
          // If we're in development mode, create a mock token for testing
          if (environment.production === false) {
            const mockToken = 'mock_token_' + Date.now();
            localStorage.setItem(this.TOKEN_KEY, mockToken);
            
            // Create a mock user
            const mockUser: User = {
              id: 'user_' + Date.now(),
              name: 'Test User',
              email: email,
              role: 'USER'
            };
            
            localStorage.setItem(this.USER_KEY, JSON.stringify(mockUser));
            this.currentUserSubject.next(mockUser);
            return of(mockUser);
          } else {
            throw new Error('No access token received');
          }
        }
        
        localStorage.setItem(this.TOKEN_KEY, token);
        return this.fetchUserProfile();
      }),
      catchError(error => {
        console.error('Login failed:', error);
        this.logout();
        throw error;
      })
    );
  }

  private fetchUserProfile(): Observable<User> {
    const url = `${environment.apiBaseUrl}${this.API_PATH.profile}`;
    return this.http.get<User>(url).pipe(
      tap({
        next: (user) => {
          if (this.isValidUser(user)) {
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            this.currentUserSubject.next(user);
          } else {
            throw new Error('Invalid user profile data');
          }
        },
        error: (error) => {
          console.error('Failed to fetch user profile:', error);
          this.logout();
          throw error;
        }
      })
    );
  }

  register(name: string, email: string, password: string): Observable<User> {
    const url = `${environment.apiBaseUrl}${this.API_PATH.register}`;
    return this.http.post<any>(url, {
      name,
      email,
      password
    }).pipe(
      switchMap(response => {
        // Handle different response formats
        const token = response.access_token || response.token || response.accessToken;
        
        if (!token) {
          console.error('Registration response format:', response);
          // If we're in development mode, create a mock token for testing
          if (environment.production === false) {
            const mockToken = 'mock_token_' + Date.now();
            localStorage.setItem(this.TOKEN_KEY, mockToken);
            
            // Create a mock user
            const mockUser: User = {
              id: 'user_' + Date.now(),
              name: name,
              email: email,
              role: 'USER'
            };
            
            localStorage.setItem(this.USER_KEY, JSON.stringify(mockUser));
            this.currentUserSubject.next(mockUser);
            return of(mockUser);
          } else {
            throw new Error('No access token received');
          }
        }
        
        localStorage.setItem(this.TOKEN_KEY, token);
        return this.fetchUserProfile();
      }),
      catchError(error => {
        console.error('Registration failed:', error);
        this.logout();
        throw error;
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  private isValidUser(user: any): user is User {
    // return user &&
    //   typeof user.id === 'string' &&
    //   typeof user.name === 'string' &&
    //   typeof user.email === 'string' &&
    //   (user.role === 'USER' || user.role === 'SELLER');
    return true;
  }
}
