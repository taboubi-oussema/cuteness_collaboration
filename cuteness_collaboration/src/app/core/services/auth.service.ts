import { Injectable, inject, PLATFORM_ID }          from '@angular/core';
import { isPlatformBrowser }                          from '@angular/common';
import { HttpClient }                                 from '@angular/common/http';
import { Router }                                     from '@angular/router';
import { BehaviorSubject, Observable, throwError }   from 'rxjs';
import { tap, catchError }                            from 'rxjs/operators';

import { environment }                                from '../../../environments/environment';
import { LoginRequest, LoginResponse,
         ResetPasswordRequest,
         ChangePasswordRequest }                      from '../../shared/models/auth.model';
import { User, Role, JwtPayload }                     from '../../shared/models/user.model';

const AUTH_URL    = `${environment.apiUrl}/auth`;
const TOKEN_KEY   = 'cc_token';
const USER_KEY    = 'cc_user';
const REMEMBER_KEY = 'cc_remember';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly _http       = inject(HttpClient);
  private readonly _router     = inject(Router);
  private readonly _platformId = inject(PLATFORM_ID);

  private readonly _currentUserSubject = new BehaviorSubject<User | null>(this.loadUser());

  readonly currentUser$ = this._currentUserSubject.asObservable();

  /**
   * Authentifie l'utilisateur, stocke le JWT dans un cookie Strict SameSite et met à jour le flux utilisateur.
   */
  login(credentials: LoginRequest, rememberMe = false): Observable<LoginResponse> {
    return this._http.post<LoginResponse>(`${AUTH_URL}/login`, credentials).pipe(
      tap((res) => {
        this.setCookie(TOKEN_KEY, res.token, rememberMe ? 30 : undefined);
        const user = this.mapToUser(res);
        this._currentUserSubject.next(user);
        if (isPlatformBrowser(this._platformId)) {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          if (rememberMe) {
            localStorage.setItem(REMEMBER_KEY, credentials.email);
          } else {
            localStorage.removeItem(REMEMBER_KEY);
          }
        }
      }),
      catchError(err => throwError(() => err))
    );
  }

  getRememberedEmail(): string | null {
    if (!isPlatformBrowser(this._platformId)) return null;
    return localStorage.getItem(REMEMBER_KEY);
  }

  logout(): void {
    this.deleteCookie(TOKEN_KEY);
    if (isPlatformBrowser(this._platformId)) {
      localStorage.removeItem(USER_KEY);
    }
    this._currentUserSubject.next(null);
    this._router.navigate(['/auth/login']);
  }

  requestPasswordReset(payload: ResetPasswordRequest): Observable<{ message: string }> {
    return this._http.post<{ message: string }>(`${AUTH_URL}/reset-password`, payload);
  }

  changePassword(payload: ChangePasswordRequest): Observable<{ message: string }> {
    return this._http.post<{ message: string }>(`${AUTH_URL}/change-password`, payload);
  }

  verifyOtp(email: string, otp: string): Observable<{ message: string }> {
    return this._http.post<{ message: string }>(`${AUTH_URL}/verify-otp`, { email, otp });
  }

  resendOtp(email: string): Observable<{ message: string }> {
    return this._http.post<{ message: string }>(`${AUTH_URL}/resend-otp`, { email });
  }

  getToken(): string | null {
    return isPlatformBrowser(this._platformId) ? this.getCookie(TOKEN_KEY) : null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      return this.decodeToken(token).exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getCurrentUser(): User | null {
    return this._currentUserSubject.value;
  }

  getRole(): Role | null {
    return this._currentUserSubject.value?.role ?? null;
  }

  hasRole(role: Role): boolean {
    return this.getRole() === role;
  }

  isAdmin():       boolean { return this.hasRole(Role.ADMIN);       }
  isSuperviseur(): boolean { return this.hasRole(Role.SUPERVISEUR); }
  isComptable():   boolean { return this.hasRole(Role.COMPTABLE);   }
  isPartenaire():  boolean { return this.hasRole(Role.PARTENAIRE);  }

  redirectByRole(role?: Role): void {
    const targetRole = role ?? this.getRole();
    switch (targetRole) {
      case Role.PARTENAIRE:
        this._router.navigate(['/partner/dashboard']); break;
      case Role.ADMIN:
        this._router.navigate(['/admin']); break;
      case Role.SUPERVISEUR:
        this._router.navigate(['/superviseur']); break;
      case Role.COMPTABLE:
        this._router.navigate(['/comptable']); break;
      default:
        this._router.navigate(['/auth/login']);
    }
  }

  private decodeToken(token: string): JwtPayload {
    return JSON.parse(atob(token.split('.')[1]));
  }

  private loadUser(): User | null {
    if (!isPlatformBrowser(this._platformId)) return null;
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as User) : null;
  }

  private setCookie(name: string, value: string, maxAgeDays?: number): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const maxAge = maxAgeDays ? `;Max-Age=${maxAgeDays * 86400}` : '';
    document.cookie = `${name}=${encodeURIComponent(value)};path=/;SameSite=Strict${maxAge}`;
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.split('; ').find(row => row.startsWith(name + '='));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
  }

  private deleteCookie(name: string): void {
    if (!isPlatformBrowser(this._platformId)) return;
    document.cookie = `${name}=;path=/;SameSite=Strict;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  private mapToUser(res: LoginResponse): User {
    const payload = this.decodeToken(res.token);
    return {
      id:           res.id            ?? payload.userId,
      nom:          res.nom           ?? payload.nom,
      email:        res.email         ?? payload.sub,
      role:         (res.role         ?? payload.role) as Role,
      solde:        res.solde         ?? 0,
      niveau:       res.niveau        ?? 0,
      actif:        true,
      dateCreation: new Date().toISOString(),
    };
  }
}