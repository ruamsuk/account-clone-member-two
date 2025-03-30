import { Component, inject, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Account } from '../models/account.model';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';
import { SharedModule } from '../shared/shared.module';

@Component({
  selector: 'app-account-detail',
  imports: [
    ThaiDatePipe, SharedModule,
  ],
  template: `
    <table class="table">
      <tr>
        <th>วันที่:</th>
        <td>
          {{ account.date | thaiDate }}
        </td>
      </tr>
      <tr>
        <th>รายการ:</th>
        <td>
          {{ account.details }}
        </td>
      </tr>
      <tr>
        <th>จำนวนเงิน:</th>
        <td>
          {{ account.amount | currency: '' : '' }}
        </td>
      </tr>
      <tr>
        <th>หมายเหตุ:</th>
        <td>
          {{ account.remark }}
        </td>
      </tr>
      <tr>
        <th>บันทึกเมื่อ:</th>
        <td>
          {{ account.create | thaiDate: 'mediumt' }}
        </td>
      </tr>
      <tr>
        <th>แก้ไขเมื่อ:</th>
        <td>
          {{ account.modify | thaiDate: 'mediumt' }}
        </td>
      </tr>
      <tr>
        <th>รับ/จ่าย:</th>
        <td>
          <span
            class="{{ account.isInCome ? 'text-green-400' : 'text-red-400' }}"
          >
            {{ account.isInCome ? 'รายรับ' : 'รายจ่าย' }}
          </span>
        </td>
      </tr>
    </table>
    <div class="flex justify-end">
      <button class="btn btn-secondary" (click)="closeDialog()">Close</button>
    </div>
  `,
  styles: ``
})
export class AccountDetailComponent implements OnInit {
  ref = inject(DynamicDialogRef);
  accountData = inject(DynamicDialogConfig);
  account!: Account;

  ngOnInit(): void {
    if (this.accountData) this.account = this.accountData.data;
  }

  closeDialog() {
    this.ref.close();
  }
}
