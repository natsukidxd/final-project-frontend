import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize, first, timeout, catchError } from 'rxjs/operators';
import { AccountService, AlertService } from '@app/_services';
import { MustMatch } from '@app/_helpers';
import { of, throwError } from 'rxjs';

enum TokenStatus {
  Validating,
  Valid,
  Invalid
}

@Component({
  templateUrl: './reset-password.component.html',
  standalone: false
})
export class ResetPasswordComponent implements OnInit {
  TokenStatus = TokenStatus;
  tokenStatus = TokenStatus.Validating;
  token: string | null = null;
  form!: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private alertService: AlertService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: MustMatch('password', 'confirmPassword')
    });

    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.tokenStatus = TokenStatus.Invalid;
      return;
    }

    this.accountService.validateResetToken(this.token)
      .pipe(
        timeout(10000),
        catchError((err) => {
          this.tokenStatus = TokenStatus.Invalid;
          this.changeDetectorRef.detectChanges();
          return throwError(() => err);
        })
      )
      .subscribe({
        next: () => {
          this.tokenStatus = TokenStatus.Valid;
          this.changeDetectorRef.detectChanges();
        },
        error: () => {
          this.tokenStatus = TokenStatus.Invalid;
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  get f() { return this.form.controls; }

  onSubmit() {
    this.submitted = true;
    this.alertService.clear();

    if (this.form.invalid || !this.token) return;

    this.loading = true;
    this.accountService.resetPassword(this.token, this.f['password'].value, this.f['confirmPassword'].value)
      .pipe(
        first(),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: () => {
          this.alertService.success('Password reset successful, you can now login', { keepAfterRouteChange: true });
          this.router.navigate(['/account/login']);
        },
        error: error => {
          this.alertService.error(error);
        }
      });
  }
}