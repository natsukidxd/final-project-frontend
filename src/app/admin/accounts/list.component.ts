import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AccountService } from '@app/_services';
import { Account } from '@app/_models';

@Component({
  templateUrl: './list.component.html',
  standalone: false
})
export class ListComponent implements OnInit {
  accounts: Account[] = [];
  loading = true;

  constructor(
    private accountService: AccountService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.accountService.getAll().subscribe({
      next: (accounts) => {
        this.accounts = Array.isArray(accounts) ? accounts : [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load accounts:', err);
        this.accounts = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteAccount(id: string) {
    const account = this.accounts?.find(x => x.id === id);
    if (!account) return;
    account.isDeleting = true;
    this.accountService.delete(id)
      .subscribe(() => {
        this.accounts = this.accounts?.filter(x => x.id !== id);
      });
  }
}
