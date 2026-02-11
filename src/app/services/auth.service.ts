import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, of, shareReplay, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, RegisterRequest, UpdateProfileRequest, User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private currentUserRequest: Observable<User | null> | null = null;
  readonly user = signal<User | null>(null);
  readonly isAuthenticated = computed(() => !!this.user());
  readonly isAdmin = computed(() => this.user()?.role === 'admin');

  login(payload: LoginRequest) {
    return this.http
      .post<void>(`${environment.apiBaseUrl}/auth/login`, payload)
      .pipe(switchMap(() => this.loadCurrentUser()));
  }

  register(payload: RegisterRequest) {
    return this.http
      .post<void>(`${environment.apiBaseUrl}/auth/register`, payload)
      .pipe(switchMap(() => this.loadCurrentUser()));
  }

  logout() {
    return this.http.post<void>(`${environment.apiBaseUrl}/auth/logout`, {}).pipe(
      finalize(() => {
        this.resetSession();
      }),
    );
  }

  loadCurrentUser() {
    const existingUser = this.user();
    if (existingUser) {
      return of(existingUser);
    }

    if (this.currentUserRequest) {
      return this.currentUserRequest;
    }

    this.currentUserRequest = this.http.get<User>(`${environment.apiBaseUrl}/users/me`).pipe(
      tap((user) => this.user.set(user)),
      catchError(() => {
        this.resetSession();
        return of(null);
      }),
      finalize(() => {
        this.currentUserRequest = null;
      }),
      shareReplay(1),
    );

    return this.currentUserRequest;
  }

  updateProfile(payload: UpdateProfileRequest) {
    return this.http
      .put<User>(`${environment.apiBaseUrl}/users/me`, payload)
      .pipe(tap((user) => this.user.set(user)));
  }

  resetSession(): void {
    this.user.set(null);
  }
}
