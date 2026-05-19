import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AccountService } from '@app/_services';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private accountService: AccountService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        // Use try-catch to ensure no unhandled exception crashes the observable chain,
        // which would prevent finalize() and the error callback from executing.
        try {
          if ([401, 403].includes(err.status) && this.accountService.accountValue) {
            this.accountService.logout();
          }

          let error: string;

          if (typeof err.error === 'string') {
            error = err.error;
          } else if (err.error && typeof err.error === 'object') {
            const body = err.error;

            if (body.detail && typeof body.detail === 'string') {
              error = body.detail;
            } else if (body.error?.message) {
              error = body.error.message;
            } else if (body.message) {
              error = body.message;
            } else if (typeof body.error === 'string') {
              error = body.error;
            } else if (body.title) {
              error = body.title;
            } else {
              try {
                error = JSON.stringify(body);
              } catch {
                error = '';
              }
            }
          } else {
            error = err.statusText || 'An unknown error occurred';
          }

          if (!error || error === '{}' || error === '') {
            error = err.statusText || 'An unknown error occurred';
          }

          return throwError(() => error);
        } catch (e) {
          console.error('ErrorInterceptor: unhandled exception', e);
          return throwError(() => 'An unexpected error occurred');
        }
      })
    );
  }
}