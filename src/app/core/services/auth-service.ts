
import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  LoginRequest,
  AuthResponse,
  UserProfile,
  RegisterRequest,
  ChangePasswordRequest,
  ApiMessage
} from '../../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly apiUrl = environment.api.auth;

  private readonly tokenKey = 'ccm_access_token';
  private readonly expiresKey = 'ccm_token_expires';
  private readonly userKey = 'ccm_user';

  private readonly userState = signal<UserProfile | null>(
    this.readStoredUser()
  );

  readonly currentUser = this.userState.asReadonly();

  readonly isAuthenticated = computed(() =>
    this.hasValidToken()
  );

  readonly isAdmin = computed(() =>
    this.hasValidToken() &&
    this.userState()?.roles.includes('Admin') === true
  );

  readonly displayName = computed(() =>
    this.userState()?.fullName ||
    this.userState()?.username ||
    ''
  );

  login(request: LoginRequest): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(
    `${this.apiUrl}/login`,
    request
  ).pipe(
    tap(response => this.storeSession(response))
  );
}

  register(request: RegisterRequest): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(
      `${this.apiUrl}/register`,
      request
    );
  }

  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(
      `${this.apiUrl}/me`
    ).pipe(
      tap(user => {
        this.userState.set(user);

        sessionStorage.setItem(
          this.userKey,
          JSON.stringify(user)
        );
      }),
      catchError(error => {
        if (error.status === 401) {
          this.clearSession();
        }

        return throwError(() => error);
      })
    );
  }

  changePassword(
    request: ChangePasswordRequest
  ): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(
      `${this.apiUrl}/change-password`,
      request
    );
  }

  getToken(): string | null {
    if (!this.hasValidToken()) {
      this.clearSession();
      return null;
    }

    return sessionStorage.getItem(this.tokenKey);
  }

  hasValidToken(): boolean {
    const token = sessionStorage.getItem(this.tokenKey);
    const expires = sessionStorage.getItem(this.expiresKey);

    if (!token || !expires) {
      return false;
    }

    const expiresAt = Date.parse(expires);

    return Number.isFinite(expiresAt) &&
      expiresAt > Date.now();
  }

  hasRole(role: string): boolean {
    return this.hasValidToken() &&
      this.userState()?.roles.includes(role) === true;
  }

  logout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  clearSession(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.expiresKey);
    sessionStorage.removeItem(this.userKey);

    this.userState.set(null);
  }

  private storeSession(response: AuthResponse): void {
    const profile: UserProfile = {
      userId: response.userId,
      username: response.username,
      email: response.email,
      fullName: response.fullName,
      roles: response.roles
    };

    sessionStorage.setItem(
      this.tokenKey,
      response.accessToken
    );

    sessionStorage.setItem(
      this.expiresKey,
      response.expiresAt
    );

    sessionStorage.setItem(
      this.userKey,
      JSON.stringify(profile)
    );

    this.userState.set(profile);
  }

  private readStoredUser(): UserProfile | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }

    const token = sessionStorage.getItem(this.tokenKey);
    const expires = sessionStorage.getItem(this.expiresKey);

    if (!token || !expires ||
        Date.parse(expires) <= Date.now()) {
      return null;
    }

    try {
      const stored = sessionStorage.getItem(this.userKey);

      return stored
        ? JSON.parse(stored) as UserProfile
        : null;
    } catch {
      return null;
    }
  }
}