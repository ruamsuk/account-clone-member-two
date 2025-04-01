import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxCurrencyDirective } from 'ngx-currency';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { finalize, Observable } from 'rxjs';
import { AccountsService } from '../services/accounts.service';
import { ToastService } from '../services/toast.service';
import { SharedModule } from '../shared/shared.module';

@Component({
  selector: 'app-accounts',
  imports: [SharedModule, NgxCurrencyDirective],
  template: `
    <div>
      <hr class="h-px bg-gray-200 border-0"/>
      <div class="grid grid-cols-1 gap-4 p-3">
        <form [formGroup]="accountForm" (ngSubmit)="saveAccount()">
          <input type="hidden" name="hidden"><!--/ focus this element -->
          <div class="my-5">
            @if (isDateValid) {
              <label [ngClass]="{ 'p-error': isDateValid }" for="icondisplay"
              >วันที่ทำรายการ</label
              >
            } @else {
              <label for="icondisplay">วันที่ทำรายการ</label>
            }
            <p-datePicker
              formControlName="date"
              [iconDisplay]="'input'"
              [showIcon]="true"
              inputId="icondisplay"
              appendTo="body"
              styleClass="w-full"/>
            @if (isDateValid; as messages) {
              <small class="block p-error pl-2 font-semibold">
                {{ messages }}
              </small>
            }
          </div>
          <div class="">
            @if (isDetailsValid) {
              <label [ngClass]="{ 'p-error': isDetailsValid }" for="details"
              >รายการ</label
              >
            } @else {
              <label for="details">รายการ</label>
            }
            <input
              pInputText
              formControlName="details"
              name="details"
              class="w-full"
            />
            @if (isDetailsValid; as messages) {
              <small class="block p-error pl-2 font-semibold">
                {{ messages }}
              </small>
            }
          </div>
          <div class="my-3">
            @if (isAmountValid) {
              <label [ngClass]="{ 'p-error': isAmountValid }" for="amount"
              >จำนวนเงิน</label
              >
            } @else {
              <label>จำนวนเงิน</label>
            }
            <input
              class="w-full"
              pInputText
              currencyMask
              formControlName="amount"
            />
            @if (isAmountValid; as messages) {
              <small class="block p-error pl-2 font-semibold">
                {{ messages }}
              </small>
            }
          </div>
          <div class="">
            <label for="remark">หมายเหตุ</label>
            <input
              pInputText
              formControlName="remark"
              name="remark"
              class="w-full"
            />
          </div>
          <div class="flex items-center justify-content-start my-3">
            <p-toggleswitch formControlName="isInCome"/>
            <span [ngClass]="{
            isIncome: accountForm.get('isInCome')?.value,
            isExpense: !accountForm.get('isInCome')?.value,
            }" class="ml-3 text-lg -mt-2">{{ statusMessage }}</span>
          </div>
          <div>
            <div class="mb-3">
              <hr class="h-px bg-gray-200 border-0 mb-1"/>
            </div>

            <div class="flex mt-2 mb-1">
              <p-button
                label="Cancel"
                severity="secondary"
                styleClass="w-full"
                class="w-full mr-2"
                (onClick)="close(false)"
              />
              <p-button
                label="Save"
                [disabled]="accountForm.invalid"
                styleClass="w-full"
                class="w-full"
                (onClick)="saveAccount()"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: ``
})
export class AccountsComponent implements OnInit, OnDestroy {
  toastService = inject(ToastService);
  accountsService = inject(AccountsService);
  accountData = inject(DynamicDialogConfig);
  dialogRef = inject(DynamicDialogRef);
  statusMessage = 'รายรับ';
  loading = signal(false);

  accountForm = new FormGroup({
    id: new FormControl(null),
    date: new FormControl('', Validators.required),
    details: new FormControl('', Validators.required),
    amount: new FormControl('', Validators.required),
    isInCome: new FormControl(false),
    remark: new FormControl(''),
  });

  ngOnInit(): void {
    if (this.accountData && this.accountData.data) {
      const data = this.accountData.data;
      this.accountForm.patchValue({
        ...data,
        date: this.accountData.data.date.toDate(),
      });
    }
    this.updateStatusMessage();
    this.accountForm.get('isInCome')?.valueChanges
      .subscribe({
        next: () => this.updateStatusMessage(),
        error: error => console.error('Error updating status message:', error),
      });
  }

  updateStatusMessage(): void {
    this.statusMessage = this.accountForm.get('isInCome')?.value
      ? 'รายรับ'
      : 'รายจ่าย';
  }

  get isDateValid(): any {
    const control = this.accountForm.get('date');
    const isInValid = control?.invalid && control.touched;
    if (isInValid) {
      return control.hasError('required')
        ? 'This field is required'
        : 'Enter a valid date';
    }
  }

  get isDetailsValid(): any {
    const control = this.accountForm.get('details');
    const isInValid = control?.invalid && control.touched;
    if (isInValid) {
      return control.hasError('required')
        ? 'This field is required'
        : 'Enter a valid date';
    }
  }

  get isAmountValid(): any {
    const control = this.accountForm.get('amount');
    const isInValid = control?.invalid && control.touched;
    if (isInValid) {
      return control.hasError('required')
        ? 'This field is required'
        : 'Enter a valid amount';
    }
  }

  ngOnDestroy(): void {
    if (this.dialogRef) this.dialogRef.close();
  }

  /**
   * 1. Check if the form is valid
   * 2. Get the account object from the form
   * 3. Set the loading state to true
   * 4. Check if the account data exists
   * 5. If it exists, update the account
   * 6. If it doesn't exist, add the account
   * 7. Subscribe to the operation
   * 8. Show success message
   * 9. Close the dialog
   * 10. Show error message
   * 11. Close the dialog
   * */
  saveAccount() {
    if (this.accountForm.invalid) return;

    const account = this.accountForm.value;
    this.loading.set(true);

    let operation: Observable<any>;

    if (this.accountData.data) {
      operation = this.accountsService.updateAccount(account);
    } else {
      operation = this.accountsService.addAccount(account);
    }

    operation.pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => {
        this.toastService.showSuccess(
          'Successfully',
          this.accountData.data
            ? 'Updated account successfully.'
            : 'Added account successfully.'
        );
        this.close(true);
      },
      error: (error) => {
        this.toastService.showError('Error', `An error occurred: ${error.message}`);
        console.error(error.message);
        this.close(false);
      },
    });

  }

  close(edit: boolean) {
    this.dialogRef.close(edit);
  }
}
