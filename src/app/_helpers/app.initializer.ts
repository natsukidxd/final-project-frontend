import { AccountService } from '@app/_services';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export function appInitializer(accountService: AccountService) {
  return () => {
    // Only attempt token refresh if user was previously logged in
    if (!localStorage.getItem('isLoggedIn')) {
      return of(undefined);
    }

    return accountService.refreshToken().pipe(
      catchError(() => {
        localStorage.removeItem('isLoggedIn');
        return of(undefined);
      })
    );
  };
}
