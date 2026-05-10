import { Component } from '@angular/core';
import { AccountService } from '@app/_services';
import { Account } from '@app/_models';

@Component({
  templateUrl: './details.component.html',
  standalone: false
})
export class DetailsComponent {
  account: Account | null;

  constructor(private accountService: AccountService) {
    this.account = this.accountService.accountValue;
  }
}