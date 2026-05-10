import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, materialize, dematerialize } from 'rxjs/operators';
import { Role } from '@app/_models';

// array to hold registered users
const accountsKey = 'angular-21-auth-boilerplate-accounts';
let accounts: any[] = JSON.parse(localStorage.getItem(accountsKey)!) || [];

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const { url, method, headers, body } = request;
    const isLoggedIn = headers.get('Authorization')?.startsWith('Bearer');
    const currentUser = isLoggedIn ? JSON.parse(atob(headers.get('Authorization')!.split('.')[1])) : null;

    return handleRoute();

    function handleRoute() {
      switch (true) {
        case url.endsWith('/accounts/register') && method === 'POST':
          return register();
        case url.endsWith('/accounts/verify-email') && method === 'POST':
          return verifyEmail();
        case url.endsWith('/accounts/forgot-password') && method === 'POST':
          return forgotPassword();
        case url.endsWith('/accounts/validate-reset-token') && method === 'POST':
          return validateResetToken();
        case url.endsWith('/accounts/reset-password') && method === 'POST':
          return resetPassword();
        case url.endsWith('/accounts/authenticate') && method === 'POST':
          return authenticate();
        case url.endsWith('/accounts/refresh-token') && method === 'POST':
          return refreshToken();
        case url.endsWith('/accounts/revoke-token') && method === 'POST':
          return revokeToken();
        case !!url.match(/\/accounts\/\d+$/) && method === 'GET':
          return getById();
        case url.endsWith('/accounts') && method === 'GET':
          return getAll();
        case !!url.match(/\/accounts\/\d+$/) && method === 'PUT':
          return update();
        case !!url.match(/\/accounts\/\d+$/) && method === 'DELETE':
          return _delete();
        default:
          return next.handle(request);
      }
    }

    function register() {
      const { title, firstName, lastName, email, password } = body;
      const account = accounts.find(x => x.email === email);

      if (account) {
        return error('Email "' + email + '" is already registered');
      }

      const newAccount: any = {
        id: accounts.length ? Math.max(...accounts.map(x => x.id)) + 1 : 1,
        title, firstName, lastName, email,
        role: accounts.length === 0 ? Role.Admin : Role.User,
        created: new Date().toISOString(),
        verified: null,
        verificationToken: `verification-token-${Date.now()}`
      };

      newAccount.passwordHash = btoa(password); // fake hash
      accounts.push(newAccount);
      localStorage.setItem(accountsKey, JSON.stringify(accounts));

      // Display verification email
      const verifyUrl = `${location.origin}/account/verify-email?token=${newAccount.verificationToken}`;
      const emailMessage = `
        <h4>Verify Email</h4>
        <p>Thanks for registering! Please click the below link to verify your email address:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      `;
      const alertService = (window as any).alertService;
      if (alertService) {
        setTimeout(() => alertService.info(emailMessage, { autoClose: false }), 1000);
      }

      return ok({ message: 'Registration successful, please check your email for verification instructions' });
    }

    function verifyEmail() {
      const { token } = body;
      const account = accounts.find(x => x.verificationToken === token);

      if (!account) {
        return error('Verification failed');
      }

      account.verified = new Date().toISOString();
      account.verificationToken = null;
      localStorage.setItem(accountsKey, JSON.stringify(accounts));

      return ok({ message: 'Verification successful, you can now login' });
    }

    function forgotPassword() {
      const { email } = body;
      const account = accounts.find(x => x.email === email);

      if (!account) {
        return ok({ message: 'Please check your email for password reset instructions' });
      }

      account.resetToken = `reset-token-${Date.now()}`;
      account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      localStorage.setItem(accountsKey, JSON.stringify(accounts));

      const resetUrl = `${location.origin}/account/reset-password?token=${account.resetToken}`;
      const emailMessage = `
        <h4>Reset Password</h4>
        <p>Please click the below link to reset your password, the link will be valid for 1 day:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
      `;
      const alertService = (window as any).alertService;
      if (alertService) {
        setTimeout(() => alertService.info(emailMessage, { autoClose: false }), 1000);
      }

      return ok({ message: 'Please check your email for password reset instructions' });
    }

    function validateResetToken() {
      const { token } = body;
      const account = accounts.find(x => x.resetToken === token && new Date(x.resetTokenExpires) > new Date());

      if (!account) {
        return error('Invalid token');
      }

      return ok();
    }

    function resetPassword() {
      const { token, password } = body;
      const account = accounts.find(x => x.resetToken === token && new Date(x.resetTokenExpires) > new Date());

      if (!account) {
        return error('Invalid token');
      }

      account.passwordHash = btoa(password);
      account.resetToken = null;
      account.resetTokenExpires = null;
      localStorage.setItem(accountsKey, JSON.stringify(accounts));

      return ok({ message: 'Password reset successful, you can now login' });
    }

    function authenticate() {
      const { email, password } = body;
      const account = accounts.find(x => x.email === email && x.passwordHash === btoa(password));

      if (!account) {
        return error('Email or password is incorrect');
      }

      if (!account.verified) {
        return error('Please verify your email before logging in');
      }

      const jti = `jti-${Date.now()}`;
      const jwtToken = btoa(JSON.stringify({ id: account.id, sub: account.id, role: account.role, jti, iat: Date.now() / 1000, exp: Date.now() / 1000 + 900 }));
      const refreshToken = `fake-refresh-token-${Date.now()}`;

      account.refreshTokens = account.refreshTokens || [];
      account.refreshTokens.push({
        token: refreshToken,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created: new Date().toISOString(),
        createdByIp: '::1'
      });
      localStorage.setItem(accountsKey, JSON.stringify(accounts));

      return ok({
        id: account.id,
        title: account.title,
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        role: account.role,
        created: account.created,
        verified: account.verified,
        isVerified: !!account.verified,
        jwtToken
      }, {
        headers: { 'Set-Cookie': `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=604800` }
      });
    }

    function refreshToken() {
      // In fake backend, check for refresh token in cookie header
      const cookieHeader = headers.get('Cookie') || headers.get('cookie') || '';
      const tokenMatch = cookieHeader.match(/refreshToken=([^;]+)/);
      const refreshToken = tokenMatch ? tokenMatch[1] : null;

      if (!refreshToken) {
        return error('Refresh token not found');
      }

      const account = accounts.find(x =>
        x.refreshTokens?.some((t: any) =>
          t.token === refreshToken &&
          new Date(t.expires) > new Date() &&
          !t.revoked
        )
      );

      if (!account) {
        return error('Invalid refresh token');
      }

      const activeToken = account.refreshTokens.find((t: any) => t.token === refreshToken);
      activeToken.revoked = new Date().toISOString();
      activeToken.revokedByIp = '::1';

      const newRefreshToken = `fake-refresh-token-${Date.now()}`;
      account.refreshTokens.push({
        token: newRefreshToken,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created: new Date().toISOString(),
        createdByIp: '::1'
      });
      localStorage.setItem(accountsKey, JSON.stringify(accounts));

      const jti = `jti-${Date.now()}`;
      const jwtToken = btoa(JSON.stringify({ id: account.id, sub: account.id, role: account.role, jti, iat: Date.now() / 1000, exp: Date.now() / 1000 + 900 }));

      return ok({
        id: account.id,
        title: account.title,
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        role: account.role,
        created: account.created,
        verified: account.verified,
        isVerified: !!account.verified,
        jwtToken
      }, {
        headers: { 'Set-Cookie': `refreshToken=${newRefreshToken}; HttpOnly; Path=/; Max-Age=604800` }
      });
    }

    function revokeToken() {
      if (!currentUser) return unauthorized();

      const account = accounts.find(x => x.id === currentUser.id);
      if (!account) return unauthorized();

      const { token } = body;
      const refreshToken = token || headers.get('Cookie')?.match(/refreshToken=([^;]+)/)?.[1];

      if (refreshToken) {
        const found = account.refreshTokens?.find((t: any) => t.token === refreshToken);
        if (found) {
          found.revoked = new Date().toISOString();
          found.revokedByIp = '::1';
          localStorage.setItem(accountsKey, JSON.stringify(accounts));
        }
      }

      return ok({ message: 'Token revoked' });
    }

    function getAll() {
      if (!currentUser) return unauthorized();
      if (currentUser.role !== Role.Admin) return unauthorized();
      return ok(accounts.map(x => ({
        id: x.id,
        title: x.title,
        firstName: x.firstName,
        lastName: x.lastName,
        email: x.email,
        role: x.role,
        created: x.created,
        verified: x.verified,
        isVerified: !!x.verified
      })));
    }

    function getById() {
      if (!currentUser) return unauthorized();
      const id = parseInt(url.split('/').pop()!);
      const account = accounts.find(x => x.id === id);

      if (!account) return error('Account not found');
      if (currentUser.role !== Role.Admin && currentUser.id !== id) return unauthorized();

      return ok({
        id: account.id,
        title: account.title,
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        role: account.role,
        created: account.created,
        verified: account.verified,
        isVerified: !!account.verified
      });
    }

    function update() {
      if (!currentUser) return unauthorized();
      const id = parseInt(url.split('/').pop()!);
      const account = accounts.find(x => x.id === id);

      if (!account) return error('Account not found');
      if (currentUser.role !== Role.Admin && currentUser.id !== id) return unauthorized();

      Object.assign(account, body);
      if (body.password) {
        account.passwordHash = btoa(body.password);
      }
      localStorage.setItem(accountsKey, JSON.stringify(accounts));

      return ok({
        id: account.id,
        title: account.title,
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        role: account.role,
        created: account.created,
        verified: account.verified,
        isVerified: !!account.verified
      });
    }

    function _delete() {
      if (!currentUser) return unauthorized();
      const id = parseInt(url.split('/').pop()!);
      const account = accounts.find(x => x.id === id);

      if (!account) return error('Account not found');
      if (currentUser.role !== Role.Admin && currentUser.id !== id) return unauthorized();

      accounts = accounts.filter(x => x.id !== id);
      localStorage.setItem(accountsKey, JSON.stringify(accounts));

      return ok({ message: 'Account deleted successfully' });
    }

    function ok(body?: any, options?: any) {
      return of(new HttpResponse({ status: 200, body, ...options }))
        .pipe(delay(500));
    }

    function error(message: string) {
      return throwError(() => ({ error: { message }, status: 400 }))
        .pipe(materialize(), delay(500), dematerialize());
    }

    function unauthorized() {
      return throwError(() => ({ error: { message: 'Unauthorized' }, status: 401 }))
        .pipe(materialize(), delay(500), dematerialize());
    }
  }
}

export const fakeBackendProvider = {
  provide: HTTP_INTERCEPTORS,
  useClass: FakeBackendInterceptor,
  multi: true
};