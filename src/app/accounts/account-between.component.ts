import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { forkJoin, Observable, Subject, take, takeUntil } from 'rxjs';
import { Account } from '../models/account.model';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';
import { AccountsService } from '../services/accounts.service';
import { AuthService } from '../services/auth.service';
import { ConfirmService } from '../services/confirm.service';
import { ToastService } from '../services/toast.service';
import { SharedModule } from '../shared/shared.module';
import { AccountsComponent } from './accounts.component';

@Component({
  selector: 'app-account-between',
  imports: [SharedModule, ThaiDatePipe,],
  template: `
    @if (loading()) {
      <div class="loading-shade">
        <p-progressSpinner strokeWidth="4" ariaLabel="loading"/>
      </div>
    }
    <div class="flex flex-wrap p-fluid justify-center items-center mt-2">
      <p-card>
        <div class="text-center font-thasadith text-orange-200 text-base md:text-2xl -mt-3 mb-2">
          รายการตามช่วงเวลา
        </div>
        <div class="flex-auto">
          <p-floatlabel variant="on">
            <p-datePicker
              [formControl]="selectedDates"
              [iconDisplay]="'input'"
              [showIcon]="true"
              [readonlyInput]="true" (onSelect)="onSelect()"
              selectionMode="range" styleClass="w-[250px]"/>
            <label for="on_label">วันเริ่มต้น - วันสิ้นสุด</label>
          </p-floatlabel>
        </div>
      </p-card>
    </div>
    @if (accountExp) {
      <div class="table-container items-center mt-3">
        <p-table
          [value]="accountExp"
          [rowHover]="true"
          [tableStyle]="{ 'min-width': '50rem' }"
          [scrollable]="true"
          scrollHeight="400px"
          styleClass="p-datatable-striped">
          <ng-template #caption>
            <div class="flex justify-between font-thasadith font-semibold text-base md:text-xl">
            <span class="text-orange-500">
              รายจ่าย
            </span>
              <span [ngClass]="{'text-red-300': calculateBalance() < 0, 'text-green-300': calculateBalance() >= 0}"
                    class="hidden md:block text-xl">
                @if (calculateBalance() < 0) {
                  เกินงบ:
                } @else {
                  คงเหลือ:
                }
                {{ calculateBalance() | currency: '' : '' }} บาท</span
              >
              <p-button icon="pi pi-refresh" (click)="resetForm()"/>
            </div>
          </ng-template>
          <ng-template #header>
            <tr>
              <th>#</th>
              <th>วันที่</th>
              <th>รายการ</th>
              <th>จำนวนเงิน</th>
              <th>หมายเหตุ</th>
              <th>Action</th>
            </tr>
          </ng-template>
          <ng-template #body let-account let-rowIndex=rowIndex>
            <tr>
              <td>{{ rowIndex + 1 }}</td>
              <td>{{ account.date | thaiDate }}</td>
              <td>{{ account.details }}</td>
              <td>{{ account.amount | currency: '' : '' }}</td>
              <td>{{ account.remark }}</td>
              <td>
                @if (isAdmin()) {
                  <i
                    pTooltip="แก้ไข"
                    (click)="showDialog(account)"
                    tooltipPosition="bottom"
                    class="pi pi-pen-to-square mx-2 text-blue-400"
                  ></i>
                  <p-confirmPopup/>
                  <i
                    pTooltip="ลบข้อมูล"
                    tooltipPosition="bottom"
                    class="pi pi-trash text-red-400 ml-1" (click)="confirm($event, account.id)"
                  ></i>
                }
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="6">
                <p-message
                  severity="warn"
                  icon="pi pi-exclamation-circle"
                  text="ไม่พบข้อมูล" styleClass="h-full"/>
              </td>
            </tr>
          </ng-template>
          <ng-template #summary>
            <div class="mySummary">
              <span>
                รวม:
                <span class="text-orange-300 mx-3">
                  {{ accountExp ? accountExp.length : 0 }}
                </span>
                รายการ.
              </span>
              <span>
                เป็นเงิน:
                <span class="text-orange-300 mx-3">
                  {{ totalExpenses | currency: '' : '' }}
                </span>
                บาท
              </span>
            </div>
          </ng-template>
        </p-table>
      </div>
    }
    @if (accountIncome) {
      <div class="table-container items-center mt-3">
        <p-table
          [value]="accountIncome"
          [rowHover]="true"
          [tableStyle]="{ 'min-width': '50rem' }"
          [scrollable]="true"
          scrollHeight="400px"
          styleClass="p-datatable-striped">
          <ng-template #caption>
            <div class="flex items-center justify-between">
              <span class="text-green-400 font-thasadith font-bold text-base md:text-xl">
                รายรับ
              </span>
              <p-button icon="pi pi-refresh"></p-button>
            </div>
          </ng-template>
          <ng-template #header>
            <tr>
              <th>#</th>
              <th>วันที่</th>
              <th>รายการ</th>
              <th>จำนวนเงิน</th>
              <th>หมายเหตุ</th>
              <th>Action</th>
            </tr>
          </ng-template>
          <ng-template #body let-accIncome let-rowIndex="rowIndex">
            <tr>
              <td>{{ rowIndex + 1 }}</td>
              <td>{{ accIncome.date | thaiDate }}</td>
              <td>{{ accIncome.details }}</td>
              <td>{{ accIncome.amount | currency:'':'' }}</td>
              <td>{{ accIncome.remark }}</td>
              <td>
                @if (isAdmin()) {
                  <i
                    pTooltip="แก้ไข"
                    (click)="showDialog(accIncome)"
                    tooltipPosition="bottom"
                    class="pi pi-pen-to-square mr-2 ml-2 text-blue-400"
                  ></i>
                  <p-confirmPopup/>
                  <i
                    pTooltip="ลบข้อมูล"
                    (click)="confirm($event, accIncome.id)"
                    tooltipPosition="bottom"
                    class="pi pi-trash text-red-400 ml-1"
                  ></i>
                }
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="6">
                <p-message
                  severity="warn"
                  icon="pi pi-exclamation-circle"
                  text="ไม่พบข้อมูล ..." styleClass="h-full"/>
              </td>
            </tr>
          </ng-template>
          <ng-template #summary>
            <div class="mySummary">
              <span>
                รวม:
                <span class="text-green-400 mx-3">
                  {{ accountIncome ? accountIncome.length : 0 }}
                </span>
                รายการ.
              </span>
              <span>
                เป็นเงิน:
                <span class="text-orange-300 mx-3">
                  {{ totalIncome | currency: '' : '' }}
                </span>
                บาท
              </span>
            </div>
          </ng-template>
        </p-table>
      </div>
    }
  `,
  styles: ``
})
export class AccountBetweenComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  accountsService = inject(AccountsService);
  confirmService = inject(ConfirmService);
  dialogService = inject(DialogService);

  selectedDates = new FormControl();
  dialogRef: DynamicDialogRef | undefined;
  private destroy$ = new Subject<void>();

  account!: Account[];
  accountIncome!: Account[];
  accountExp!: Account[];
  totalIncome: number = 0;
  totalExpenses: number = 0;

  loading = signal(false);
  isAdmin = signal(false);

  results$: Observable<any> = new Observable();

  ngOnInit(): void {
    this.getRole();
  }

  getRole() {
    this.authService.isAdmin().subscribe(admin => {
      this.isAdmin.set(admin);
    });
  }


  onSelect() {
    const selectedDates = this.selectedDates.value;
    if (
      selectedDates &&
      selectedDates.length === 2 &&
      selectedDates[0] &&
      selectedDates[1]
    ) {
      const start = selectedDates[0];
      const end = selectedDates[1];
      const starter = new Date(start);
      const ender = new Date(end);

      if (starter >= ender) {
        this.toastService.showError(
          'Error',
          'วันเริ่มต้นกับวันสิ้นสุดต้องคนละวันกัน',
        );
        return;
      }

      this.loading.set(true);

      /** combine search expenses and incomes */
      forkJoin<any>([
        this.accountsService
          .searchDateTransactions(start, end, false)
          .pipe(take(1)),
        this.accountsService
          .searchDateTransactions(start, end, true)
          .pipe(take(1)),

      ])
        .subscribe({
          next: ([expenses, incomes]: [Account[], Account[]]) => {
            this.accountExp = expenses;
            this.accountIncome = incomes;

            /** Calculate total expenses and total income */
            this.totalExpenses = expenses.reduce(
              (sum: number, expense: { amount: number }) => sum + expense.amount,
              0,
            );
            this.totalIncome = incomes.reduce(
              (sum: number, income: { amount: number }) => sum + income.amount,
              0,
            );
            this.loading.set(false);
          },
          error: (error: any) => {
            this.toastService.showError('Error', error.message);
            this.loading.set(false);
          },
        } as any);
    } else {
      console.log('Please select a valid date range.');
    }
  }

  calculateBalance(): number {
    const totalIncome: number = this.totalIncome || 0;
    const totalExpenses: number = this.totalExpenses || 0;
    return totalIncome - totalExpenses;
  }

  showDialog(account: any) {
    let header = account ? 'แก้ไขรายการ' : 'เพิ่มรายการ';

    this.dialogRef = this.dialogService.open(AccountsComponent, {
      data: account,
      header: header,
      width: '360px',
      contentStyle: {overflow: 'auto'},
      breakpoints: {
        '960px': '360px',
        '640px': '360px',
        '390px': '360px',
      },
      closable: true,
    });
    this.dialogRef.onClose
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        if (data) {
          this.onSelect();
        }
      });
  }

  resetForm() {
    this.selectedDates.reset();
    this.accountExp = [];
    this.accountIncome = [];
    this.totalIncome = 0;
    this.totalExpenses = 0;
  }

  confirm(event: MouseEvent, id: string) {
    this.confirmService.confirm(
      event,
      id,
      this.accountsService,
      this.accountsService.deleteAccount.bind(this.accountsService),
      () => {
        console.log('Account deleted successfully');
      },
      (error: any) => console.error('Error deleting account: ', error),
    );
  }

  ngOnDestroy(): void {
    if (this.dialogRef) this.dialogRef.close();
  }
}
