import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxCurrencyDirective } from 'ngx-currency';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Credit } from '../models/credit.model';
import { CreditService } from '../services/credit.service';
import { ToastService } from '../services/toast.service';
import { SharedModule } from '../shared/shared.module';

@Component({
  selector: 'app-credit',
  imports: [SharedModule, NgxCurrencyDirective],
  template: `
    <div>
      <hr class="h-px bg-gray-200 border-0"/>
      <div class="grid grid-cols-1 gap-4 p-3">
        <form [formGroup]="creditForm" (ngSubmit)="saveCredit()">
          <input type="hidden" name="hidden"/>
          <div class="my-3">
            <label for="date">วันที่ทำรายการ</label>
            <p-datePicker
              formControlName="date"
              [iconDisplay]="'input'"
              [showIcon]="true"
              inputId="icondisplay"
              styleClass="w-full"
              appendTo="body"/>
          </div>
          <div class="my-3">
            <label for="details">รายการ</label>
            <input
              pInputText
              formControlName="details"
              name="details"
              placeholder="รายการ"
              class="w-full"
            />
          </div>
          <div class="my-3">
            <label for="amount">จำนวนเงิน</label>
            <input
              class="w-full"
              pInputText
              currencyMask
              formControlName="amount"
            />
          </div>
          <div class="my-3">
            <label for="remark">หมายเหตุ</label>
            <input
              pInputText
              formControlName="remark"
              name="remark"
              class="w-full"
            />
          </div>
          <div class="flex items-center justify-start my-3">
            <p-toggleswitch
              formControlName="isCashback"/>
            <span [ngClass]="{
            isIncome: creditForm.get('isCashback')?.value,
            isExpense: !creditForm.get('isCashback')?.value,
            }" class="ml-3 text-lg -mt-2">
              {{ statusMessage }}
            </span>
          </div>
          <div class="mb-3">
            <hr class="h-px bg-gray-200 border-0">
          </div>
          <div class="flex my-3 gap-2">
            <div class="grow">
              <p-button
                label="Cancel"
                severity="secondary"
                styleClass="w-full"
                class="w-full mr-2"
                (onClick)="close()"
              />
            </div>
            <div class="grow">
              <button [disabled]="creditForm.invalid"
                      [ngClass]="{
              'btn-disabled': creditForm.invalid,
              'btn btn-info': creditForm.valid,
              }" type="submit" class="w-full">
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: ``
})
export class CreditComponent implements OnInit, OnDestroy {
  toastService = inject(ToastService);
  dialogRef = inject(DynamicDialogRef);
  creditData = inject(DynamicDialogConfig);
  creditService = inject(CreditService);
  credit!: Credit;
  statusMessage: string = 'รายรับ/เงินคืน';

  creditForm = new FormGroup({
    id: new FormControl(null),
    date: new FormControl('', Validators.required),
    details: new FormControl('', Validators.required),
    amount: new FormControl('', Validators.required),
    created: new FormControl(''),
    modify: new FormControl(''),
    isCashback: new FormControl(false),
    remark: new FormControl(''),
  });

  constructor() {
    if (this.creditData.data) {
      const data = this.creditData.data;
      this.credit = data;

      this.creditForm.patchValue({
        ...data,
        date: data.date.toDate(),
      });
    }
  }

  ngOnInit(): void {
    this.updateStatusMessage();
  }

  updateStatusMessage() {
    this.statusMessage = this.creditForm.get('isCashback')?.value
      ? 'รายรับ/เงินคืน'
      : 'รายจ่าย';
  }

  get isAmountValid(): any {
    const control = this.creditForm.get('amount');
    const isInValid = control?.invalid && control.touched;
    if (isInValid) {
      return control.hasError('required')
        ? 'This field is required'
        : 'Enter a valid amount';
    }
  }

  saveCredit() {
    if (this.creditForm.invalid) return;

    const credit = this.creditForm.value;

    if (credit.id) {
      this.creditService
        .updateCredit(credit)
        .subscribe({
          next: () => {
            this.toastService.showSuccess('Successfully.', 'Update successfully!');
          },
          error: err => {
            this.toastService.showError('Error', `${err.message}`);
            console.error(err);
          },
        });
    } else {
      this.creditService.createCredit(credit).subscribe({
        next: () => this.toastService.showSuccess('Successfully.', 'Created successfully!'),
        error: err => {
          this.toastService.showError('Error', `${err.message}`);
          console.error(err);
        }
      });
    }
    this.close();
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    if (this.dialogRef) this.dialogRef.close();
  }

}
