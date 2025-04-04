import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { catchError, debounceTime, distinctUntilChanged, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import { Account } from '../models/account.model';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';
import { AccountsService } from '../services/accounts.service';
import { AuthService } from '../services/auth.service';
import { ConfirmService } from '../services/confirm.service';
import { ToastService } from '../services/toast.service';
import { SharedModule } from '../shared/shared.module';
import { AccountsComponent } from './accounts.component';

@Component({
  selector: 'app-account-between-detail',
  imports: [
    SharedModule,
    ThaiDatePipe
  ],
  template: `
    @if (loading()) {
      <div class="loading-shade">
        <p-progressSpinner strokeWidth="4" ariaLabel="loading"/>
      </div>
    }
    <div class="flex flex-wrap p-fluid justify-center items-center mt-2">
      <p-card>
        <div class="text-center font-thasadith text-base md:text-2xl -mt-3 mb-3">
          <span class="text-slate-300 font-semibold">รายการตามช่วงเวลาและรายการ</span>
        </div>
        <div class="card flex flex-wrap gap-2 md:gap-4">
          <div class="flex grow">
            <p-floatlabel variant="on">
              <p-datePicker
                [formControl]="selectedDates"
                [iconDisplay]="'input'"
                [showIcon]="true"
                [readonlyInput]="true"
                selectionMode="range"
                styleClass="w-[250px]"/>
              <label for="on_label">วันเริ่มต้น-วันสิ้นสุด</label>
            </p-floatlabel>
          </div>
          <div class="flex grow">
            <p-floatlabel variant="on">
              <p-iconfield pTooltip="หาข้อมูลใหม่">
                <input
                  type="text"
                  pInputText
                  [formControl]="searchDetail" class="w-[250px]"/>
                <label for="on_label">รายการ</label>
                <p-inputicon (click)="resetAll()"
                             styleClass="pi pi-list cursor-pointer"/>
              </p-iconfield>
            </p-floatlabel>
          </div>
        </div>
      </p-card>
    </div>
    @if (account && isShow()) {
      <div class="table-container myCenter mt-3">
        <p-table #tb
                 [value]="account"
                 [scrollable]="true"
                 [rowHover]="true"
                 scrollHeight="400px"
                 [tableStyle]="{ 'min-width': '35vw' }"
                 styleClass="p-datatable-striped"
        >
          <ng-template #caption>
            <div class="flex items-center justify-between">
              <span class="text-orange-400 text-2xl font-thasadith font-bold">
                รายการของ: <span class="text-green-400">
                {{ title }}
              </span>
              </span>
            </div>
          </ng-template>
          <ng-template #header>
            <tr>
              <th>#</th>
              <th style="min-width: 120px">
                <div>วันที่</div>
              </th>
              <th style="min-width: 120px">
                <div>จำนวนเงิน</div>
              </th>
              <th style="min-width: 150px">
                <div>หมายเหตุ</div>
              </th>
              <th style="min-width: 150px">
                <div>Action</div>
              </th>
            </tr>
          </ng-template>
          <ng-template #body let-account let-rowIndex="rowIndex">
            <tr>
              <td>{{ rowIndex + 1 }}</td>
              <td>
                {{ account.date | thaiDate }}
              </td>
              <td>
                {{ account.amount | currency: '' : '' }}
              </td>
              <td>
                {{ account.remark }}
              </td>
              <td>
                @if (isAdmin()) {
                  <i
                    pTooltip="แก้ไข"
                    (click)="showDialog(account)"
                    tooltipPosition="bottom"
                    class="pi pi-pen-to-square mx-2 text-sky-500"
                  ></i>
                  <p-confirmPopup/>
                  <i
                    pTooltip="ลบข้อมูล"
                    (click)="confirm($event, account.id)"
                    tooltipPosition="bottom"
                    class="pi pi-trash text-red-400"
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
                  text="ไม่พบข้อมูลรายการ: {{title}}" styleClass="h-full"/>
              </td>
            </tr>
          </ng-template>
          <ng-template #summary>
            <div
              class="flex items-center justify-around font-bold leading-9 bg-gray-900"
            >
              <span>
                รวม:
                <span class="text-orange-400 mx-3">
                  {{ account ? account.length : 0 }}
                </span>
                รายการ.
              </span>
              <span>
                เป็นเงิน:
                <span class="text-orange-400 mx-3">
                  {{ getTotal() | currency: '' : '' }}
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
export class AccountBetweenDetailComponent implements OnInit {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  accountsService = inject(AccountsService);
  confirmService = inject(ConfirmService);
  dialogService = inject(DialogService);

  selectedDates = new FormControl();
  searchDetail = new FormControl();
  dialogRef: DynamicDialogRef | undefined;

  account!: Account[];
  totalExpenses!: Account[];
  title: string = '';
  loading = signal(false);
  isAdmin = signal(false);
  isShow = signal(false);

  results$: Observable<any> = new Observable();

  ngOnInit(): void {
    /**
     * 1.เมื่อเลือกวันเริ่มต้น จะหน่วงเวลารอให้เลือกวันสิ้นสุด
     * 2.เมื่อเลือกวันสิ้นสุดจะส่งไปประมวลผลใน resultDetails()
     * */
    this.results$ = this.searchDetail.valueChanges.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      switchMap((value) => this.resultDetails(value)),
    );
    /** be sure valueChange is work! */
    this.results$.subscribe();
    this.getRole();
  }

  getRole() {
    this.authService.isAdmin().subscribe(admin => {
      this.isAdmin.set(admin);
    });
  }

  resultDetails(value: string): Observable<any> {
    const selectedDates = this.selectedDates.value;
    if (
      selectedDates &&
      selectedDates.length === 2 &&
      selectedDates[0] &&
      selectedDates[1] &&
      value !== 'null'
    ) {
      const start = selectedDates[0];
      const end = selectedDates[1];
      const starter = new Date(start);
      const ender = new Date(end);

      /** avoid same date or end less than begin */
      if (starter >= ender) {
        this.toastService.showError(
          'Error',
          'วันเริ่มต้นกับวันสิ้นสุดต้องคนละวันกัน',
        );
        return of(null);
      }

      this.loading.set(true);
      this.title = value;

      return this.accountsService.searchDesc(start, end, value)
        .pipe(
          take(1),
          tap((data: any) => {
            this.account = data;
            this.totalExpenses = data;
            this.loading.set(false);
            this.isShow.set(true);
          }),
          catchError((err: any) => {
            this.loading.set(false);
            this.isShow.set(false);
            this.toastService.showError('Error', err.message);
            console.log(err.message);
            return throwError(() => err);
          })
        );
    }
    return of(null);
  }

  confirm(event: Event, id: string) {
    this.confirmService.confirm(event, id, this.accountsService, this.accountsService.deleteAccount.bind(this.accountsService), () => {
      console.log('Account deleted successfully');
    }, (error: any) => console.error('Error deleting account: ', error));
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
    });
    this.dialogRef.onClose.subscribe((data: any) => {
      if (data) {
        this.resultDetails(this.title);
      }
    });
  }

  getTotal() {
    return this.totalExpenses.reduce((total, n) => total + Number(n.amount), 0);
  }

  resetAll(): void {
    this.searchDetail.reset();
    this.selectedDates.reset();
    this.isShow.set(false);
  }
}
