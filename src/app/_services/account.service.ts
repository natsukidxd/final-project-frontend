import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, switchMap } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { Account } from '@app/_models';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private accountSubject = new BehaviorSubject<Account | null>(null);
  public account = this.accountSubject.asObservable();
  private refreshTokenTimeout: any;

  constructor(private http: HttpClient) {}

  public get accountValue() {
    return this.accountSubject.value;
  }

  register(account: Account) {
    return this.http.post(`${environment.apiUrl}/accounts/register`, account);
  }

  verifyEmail(token: string) {
    return this.http.post(`${environment.apiUrl}/accounts/verify-email`, { token });
  }

  forgotPassword(email: string) {
    return this.http.post(`${environment.apiUrl}/accounts/forgot-password`, { email });
  }

  validateResetToken(token: string) {
    return this.http.post(`${environment.apiUrl}/accounts/validate-reset-token`, { token });
  }

  resetPassword(token: string, password: string, confirmPassword: string) {
    return this.http.post(`${environment.apiUrl}/accounts/reset-password`, { token, password, confirmPassword });
  }

  authenticate(email: string, password: string) {
    return this.http.post<any>(`${environment.apiUrl}/accounts/authenticate`, { email, password }, { withCredentials: true })
      .pipe(
        tap(account => {
          this.accountSubject.next(account);
          this.startRefreshTokenTimer();
        })
      );
  }

  refreshToken() {
    return this.http.post<any>(`${environment.apiUrl}/accounts/refresh-token`, {}, { withCredentials: true })
      .pipe(
        tap(account => {
          this.accountSubject.next(account);
          this.startRefreshTokenTimer();
        })
      );
  }

  revokeToken(token?: string) {
    const body = token ? { token } : {};
    return this.http.post(`${environment.apiUrl}/accounts/revoke-token`, body, { withCredentials: true });
  }

  logout() {
    this.revokeToken().subscribe();
    this.stopRefreshTokenTimer();
    this.accountSubject.next(null);
  }

  getAll() {
    return this.http.get<Account[]>(`${environment.apiUrl}/accounts`);
  }

  getById(id: string) {
    return this.http.get<Account>(`${environment.apiUrl}/accounts/${id}`);
  }

  update(id: string, params: any) {
    return this.http.put<Account>(`${environment.apiUrl}/accounts/${id}`, params)
      .pipe(
        tap(account => {
          if (account && account.id === this.accountValue?.id) {
            this.accountSubject.next({ ...this.accountValue, ...account });
          }
          return account;
        })
      );
  }

  delete(id: string) {
    return this.http.delete(`${environment.apiUrl}/accounts/${id}`)
      .pipe(
        tap(() => {
          if (id === this.accountValue?.id) {
            this.logout();
          }
        })
      );
  }

  private startRefreshTokenTimer() {
    const account = this.accountValue;
    if (!account || !account.jwtToken) return;

    const jwtToken = JSON.parse(atob(account.jwtToken.split('.')[1]));
    const expires = new Date(jwtToken.exp * 1000);
    const timeout = expires.getTime() - Date.now() - (60 * 1000);

    if (timeout <= 0) return;

    this.refreshTokenTimeout = setTimeout(() => {
      this.refreshToken().subscribe();
    }, timeout);
  }

  private stopRefreshTokenTimer() {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }
}