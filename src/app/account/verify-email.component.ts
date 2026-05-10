import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { AccountService, AlertService } from '@app/_services';

enum TokenStatus {
  Validating,
  Valid,
  Invalid
}

@Component({
  templateUrl: './verify-email.component.html',
  standalone: false
})
export class VerifyEmailComponent implements OnInit {
  TokenStatus = TokenStatus;
  tokenStatus = TokenStatus.Validating;
  token: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.tokenStatus = TokenStatus.Invalid;
      return;
    }

    this.accountService.verifyEmail(this.token)
      .pipe(first())
      .subscribe({
        next: () => {
          this.alertService.success('Verification successful, you can now login', { keepAfterRouteChange: true });
          this.router.navigate(['/account/login']);
        },
        error: () => {
          this.tokenStatus = TokenStatus.Invalid;
        }
      });
  }
}