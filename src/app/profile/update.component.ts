import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AccountService, AlertService } from '@app/_services';
import { MustMatch } from '@app/_helpers';

@Component({
  templateUrl: './update.component.html',
  standalone: false
})
export class UpdateComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  submitted = false;
  deleting = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private accountService: AccountService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    const account = this.accountService.accountValue;

    this.form = this.formBuilder.group({
      title: [account?.title, Validators.required],
      firstName: [account?.firstName, Validators.required],
      lastName: [account?.lastName, Validators.required],
      email: [account?.email, [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      confirmPassword: ['']
    }, {
      validators: MustMatch('password', 'confirmPassword')
    });
  }

  get f() { return this.form.controls; }

  onSubmit() {
    this.submitted = true;
    this.alertService.clear();

    if (this.form.invalid) return;

    this.loading = true;
    const account = this.accountService.accountValue;
    this.accountService.update(account!.id!, this.form.value)
      .pipe(first())
      .subscribe({
        next: () => {
          this.alertService.success('Update successful', { keepAfterRouteChange: true });
          this.router.navigate(['/profile']);
        },
        error: error => {
          this.alertService.error(error);
          this.loading = false;
        }
      });
  }

  onDelete() {
    if (!confirm('Are you sure?')) return;

    this.deleting = true;
    const account = this.accountService.accountValue;
    this.accountService.delete(account!.id!)
      .pipe(first())
      .subscribe({
        next: () => {
          this.alertService.success('Account deleted successfully', { keepAfterRouteChange: true });
        },
        error: error => {
          this.alertService.error(error);
          this.deleting = false;
        }
      });
  }
}