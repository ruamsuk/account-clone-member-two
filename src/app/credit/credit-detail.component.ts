import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Credit } from '../models/credit.model';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';
import { SharedModule } from '../shared/shared.module';

@Component({
  selector: 'app-credit-detail',
  standalone: true,
  imports: [SharedModule, ThaiDatePipe, CurrencyPipe],
  template: `
    <table class="table">
      <tr>
        <th>วันที่:</th>
        <td>{{ credit.date | thaiDate }}</td>
      </tr>
      <tr>
        <th>รายการ:</th>
        <td>{{ credit.details }}</td>
      </tr>
      <tr>
        <th>จำนวนเงิน:</th>
        <td>{{ credit.amount | currency: '' : '' }}</td>
      </tr>
      <tr>
        <th>หมายเหตุ:</th>
        <td>{{ credit.remark }}</td>
      </tr>
      <tr>
        <th>บันทึกเมื่อ:</th>
        <td>{{ credit.created | thaiDate: 'mediumt' }}</td>
      </tr>
      <tr>
        <th>แก้ไขเมื่อ:</th>
        <td>{{ credit.modify | thaiDate: 'mediumt' }}</td>
      </tr>
      <tr>
        <th>รับ/จ่าย:</th>
        <td>
          <span
            class="{{ credit.isCashback ? 'text-green-400' : 'text-red-400' }}"
          >
            {{ credit.isCashback ? 'รายรับ' : 'รายจ่าย' }}
          </span>
        </td>
      </tr>
    </table>
    <div class="flex justify-end mt-2">
      <p-button
        label="Close"
        severity="secondary"
        size="small"
        (onClick)="dialogClose()"
      />
    </div>
  `,
  styles: `

  `,
})
export class CreditDetailComponent {
  creditData = inject(DynamicDialogConfig);
  ref = inject(DynamicDialogRef);
  credit!: Credit;

  constructor() {
    if (this.creditData.data) {
      this.credit = this.creditData.data;
    }
  }

  dialogClose() {
    this.ref.close();
  }
}
