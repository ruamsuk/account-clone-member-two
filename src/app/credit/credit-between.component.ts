import { ChangeDetectorRef, Component, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { combineLatest, finalize, Observable, of, startWith, switchMap } from 'rxjs';
import { MonthSummary } from '../models/credit.model';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';
import { AuthService } from '../services/auth.service';
import { ConfirmService } from '../services/confirm.service';
import { CreditService } from '../services/credit.service';
import { MonthConversionService } from '../services/month-conversion.service';
import { SelectorService } from '../services/selector.service';
import { SharedModule } from '../shared/shared.module';
import { CreditComponent } from './credit.component';

@Component({
  selector: 'app-credit-between',
  imports: [SharedModule, ThaiDatePipe],
  template: `
    @if (loading()) {
      <div class="loading-shade">
        <p-progressSpinner strokeWidth="4" ariaLabel="loading"/>
      </div>
    }
    <div class="flex flex-wrap p-fluid justify-center items-center mt-2">
      <p-card>
        <div class="text-center font-thasadith text-base md:text-2xl -mt-3 mb-5">
          <span class="text-slate-300 font-semibold">
            รายการเครดิตตามช่วงเวลา
          </span>
        </div>
        <div class="card flex flex-wrap gap-1 md:gap-2">
          <div class="flex grow">
            <p-floatlabel variant="on">
              <p-treeSelect
                containerStyleClass="w-full"
                [formControl]="selectMonth"
                [options]="month"
                (onNodeSelect)="searchM()"/>
              <label for="treeSelect">เลือกเดือน</label>
            </p-floatlabel>
          </div>
          <div class="flex grow">
            <p-floatLabel variant="on">
              <p-treeSelect
                containerStyleClass="w-full"
                [formControl]="selectYear"
                [options]="year"
                (onNodeSelect)="search()"
                placeholder="เลิอกปี"
              />
              <label for="treeSelect">เลือกปี</label>
            </p-floatLabel>
          </div>
        </div>
      </p-card>
    </div>
    <!-- ถ้าไม่พบข้อมูลที่ต้องการค้นหา ให้แสดงข้อความแจ้ง -->
    @if (!hasData()) {
      <div class="myCenter">
        <p-message
          severity="warn"
          icon="pi pi-exclamation-circle"
          text="ไม่พบข้อมูล" styleClass="text-orange-500 font-bold text-xl">
          <span class="italic text-indigo-400">เลือกใหม่!</span>
        </p-message>
      </div>
    }
    @if (creditSummary$ | async; as creditSummary) {
      @if (creditSummary.transactions.length > 0) {
        <div class="table-container items-center justify-center mt-3">
          <div class="card">
            <p-table
              #tb
              [value]="creditSummary.transactions"
              [columns]="cols"
              [paginator]="true"
              [rows]="8"
              [rowHover]="true"
              [style]="{ 'min-width': '40rem' }"
              styleClass="p-datatable-striped"
              responsiveLayout="scroll">
              <ng-template #caption>
                <div class="flex justify-between font-semibold font-thasadith">
                <span class="text-orange-400 text-base md:text-xl">
                  รายจ่ายของเดือน ปี:
                  <span class="text-green-400 ml-2 text-base md:text-xl">
                  {{ searchMonth }} {{ searchYear }}
                </span>
                </span>
                  <p-button icon="pi pi-plus" (click)="showDialog('')"></p-button>
                </div>
              </ng-template>
              <ng-template #header>
                <tr>
                  <th>#</th>
                  <th>วันที่</th>
                  <th>รายการ</th>
                  <th [ngClass]="{'hide-on-mobile': isMobile()}">จำนวนเงิน</th>
                  <th [ngClass]="{'hide-on-mobile': isMobile()}">หมายเหตุ</th>
                  <th>Action</th>
                </tr>
              </ng-template>
              <ng-template #body let-credit let-i="rowIndex">
                <tr>
                  <td [ngClass]="{ isIncome: credit.isCashback}">
                    {{ currentPage * rowsPerPage + i + 1 }}
                  </td>
                  <td [ngClass]="{ isIncome: credit.isCashback}">
                    {{ credit.date | thaiDate }}
                  </td>
                  <td [ngClass]="{ isIncome: credit.isCashback}">
                    {{ credit.details }}
                  </td>
                  <td [ngClass]="{ isIncome: credit.isCashback, 'hide-on-mobile': isMobile() }">
                    {{ credit.amount | currency:'':'' }}
                  </td>
                  <td [ngClass]="{ isIncome: credit.isCashback, 'hide-on-mobile': isMobile() }">
                    {{ credit.remark }}
                  </td>
                  <td>
                    @if (admin()) {
                      <i
                        pTooltip="แก้ไข"
                        (click)="showDialog(credit)"
                        tooltipPosition="bottom"
                        class="pi pi-pen-to-square mx-3 text-blue-400"
                      ></i>
                      <p-confirmPopup/>
                      <i
                        pTooltip="ลบข้อมูล"
                        (click)="confirmDelete($event, credit.id)"
                        tooltipPosition="bottom"
                        class="pi pi-trash text-red-400"
                      ></i>
                    }
                  </td>
                </tr>
              </ng-template>
              <ng-template #footer>
                <tr>
                  <td>
                    <span
                      class="font-thasadith font-semibold text-base md:text-xl text-indigo-400">
                      รายจ่าย:
                    </span>
                  </td>
                  <td>
                    <div class="flex justify-start text-red-400">
                      {{ isDataAvailable(creditSummary) | currency:'':'' }}
                    </div>
                  </td>
                  <td>
                    <span class="text-indigo-400 font-thasadith font-semibold text-base md:text-xl">
                      เงินคืน:
                    </span>
                  </td>
                  <td>
                    <span class="text-green-400">
                      {{ creditSummary.cashback | currency:'':'' }}
                    </span>
                  </td>
                  <td>
                    <span class="font-thasadith text-base md:text-xl font-semibold text-indigo-400">
                      บาท
                    </span>
                  </td>
                  <td></td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </div>
      }
    }
  `,
  styles: ``
})
export class CreditBetweenComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  confirmService = inject(ConfirmService);
  cdr = inject(ChangeDetectorRef);
  dialogService = inject(DialogService);
  monthConversionService = inject(MonthConversionService);
  selectService = inject(SelectorService);
  creditService = inject(CreditService);

  selectMonth = new FormControl();
  selectYear = new FormControl();
  creditSummary$: Observable<MonthSummary> = of({
    expense: 0,
    cashback: 0,
    transactions: [],
  });
  loading = signal(false);
  admin = signal(false);
  isMobile = signal(false);
  hasData = signal(true);

  dialogRef: DynamicDialogRef | undefined;
  month: any;
  year: any;
  searchMonth: string = '';
  searchYear: string = '';
  currentPage = 0;
  rowsPerPage = 10;

  cols: any[] = [
    {field: 'index', header: 'ลำดับ'},
    {field: 'date', header: 'วัน'},
    {field: 'details', header: 'รายการ'},
    {field: 'expense', header: 'รายจ่าย', pipe: 'currency'},
    {field: 'remark', header: 'หมายเหตุ'},
  ];

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.isMobile.set(window.innerWidth < 768);
  }

  ngOnInit(): void {
    this.getRole();
    this.monthSearch();
    this.yearSearch();
    this.isMobile.set(window.innerWidth < 768);
  }

  getRole() {
    this.authService.isAdmin().subscribe(isAdmin => {
      this.admin.set(isAdmin);
    });
  }

  ngOnDestroy(): void {
    if (this.dialogRef) this.dialogRef.destroy();
  }

  searchM() {
    // console.log('changeM', this.labelMonth.label);
  }

  search() {
    const christianYear = this.convertToChristianYear(
      this.selectYear.value.label,
    );
    const monthNumber = this.monthConversionService.thaiMonthToNumber(
      this.selectMonth.value.label,
    );

    this.searchMonth = this.selectMonth.value.label;
    this.searchYear = this.selectYear.value.label;

    if (monthNumber === undefined) {
      console.error('Invalid month name:', this.selectMonth.value.label);
      return of({expense: 0, cashback: 0, transactions: []});
    }

    this.creditSummary$ = combineLatest([
      this.selectMonth.valueChanges.pipe(
        startWith(this.selectMonth.value.label),
      ),
      this.selectYear.valueChanges.pipe(startWith(christianYear)),
    ]).pipe(
      switchMap(([month, year]) => {
        const adjustMonthAndYear = this.adjustMonthAndYearForJanuary(
          monthNumber,
          year
        );

        return this.creditService.getCreditSummary(
          adjustMonthAndYear.month,
          adjustMonthAndYear.year,
        ).pipe(
          switchMap((summary) => {
            this.hasData.set(summary.transactions.length > 0);
            return of(summary);
          })
        );
      }),
      finalize(() => {
        setTimeout(() => {
          this.loading.set(false);
          this.cdr.detectChanges();
        }, 100);
      }),
    );
    return;
  }

  isDataAvailable(summary: MonthSummary) {
    return summary.expense - summary.cashback;
  }

  private monthSearch() {
    this.selectService.getMonth().then((data) => {
      this.month = data;
    });
  }

  private yearSearch() {
    this.selectService.getYear().then((data) => {
      this.year = data;
    });
  }

  private convertToChristianYear(thaiYearLabel: string): number {
    return Number(thaiYearLabel) - 543;
  }

  private adjustMonthAndYearForJanuary(
    month: number,
    year: number,
  ): { month: number; year: number } {
    if (month === 1) {
      return {month: 12, year: year - 1};
    } else {
      return {month: month - 1, year};
    }
  }

  showDialog(credit: any) {
    let header = credit ? 'Edit credit' : 'Add credit';
    this.dialogRef = this.dialogService.open(CreditComponent, {
      data: credit,
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
  }

  confirmDelete(event: Event, id: string) {
    this.confirmService.confirm(
      event,
      id,
      this.creditService,
      this.creditService.deleteCredit.bind(this.creditService),
      () => {
      },
      (error: any) => {
        console.error(error);
      }
    );
  }
}
