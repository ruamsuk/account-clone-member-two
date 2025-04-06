import { ChangeDetectorRef, Component, HostListener, OnInit, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { catchError, map, Observable, of, startWith, switchMap, tap } from 'rxjs';
import { YearSummary } from '../models/account.model';
import { InfinityToZeroPipe } from '../pipe/infinity-to-zero-pipe.pipe';
import { IncomeExpenseService } from '../services/income-expense.service';
import { SelectorService } from '../services/selector.service';
import { ToastService } from '../services/toast.service';
import { SharedModule } from '../shared/shared.module';

@Component({
  selector: 'app-accounts-year-calculate',
  imports: [SharedModule, InfinityToZeroPipe],
  template: `
    @if (loading()) {
      <div class="loading-shade">
        <p-progressSpinner strokeWidth="4" ariaLabel="loading"/>
      </div>
    }
    <div class="flex flex-wrap p-fluid justify-center items-center mt-2">
      <p-card>
        <div class="text-center font-thasadith text-orange-200 text-base md:text-2xl -mt-3 mb-2">
          รายการตลอดทั้งปี
        </div>
        <div class="flex justify-center">
          <p-floatlabel variant="on" class="w-full">
            <p-treeSelect
              class="w-full"
              containerStyleClass="w-full"
              [formControl]="selectedYear"
              [options]="year"
              (onNodeSelect)="searchAllYear()"
            />
            <label for="on_label">เลือกปี</label>
          </p-floatlabel>
        </div>
      </p-card>
    </div>
    @if (incomeExpenseSummaryArray$ | async; as summaryArray) {
      <ng-container>
        @if (summaryArray.length > 0) {
          <div class="flex justify-center items-center">
            <div class="table-container">
              <p-table
                [value]="summaryArray ?? []"
                [rowHover]="true"
                [scrollable]="true"
                [columns]="cols"
                [tableStyle]="{ 'min-width': '650px'}"
                scrollHeight="400px"
              >
                <ng-template #caption>
                  <div class="flex justify-between">
                      <span class="text-orange-400 font-thasadith font-bold text-base md:text-2xl">
                        ค่าใช้จ่ายในรอบปี:
                        <span class="ml-2 text-green-400 text-base md:text-xl">
                          {{ showYear }}
                        </span>
                      </span>
                    <p-button icon="pi pi-refresh"/>
                  </div>
                </ng-template>
                <ng-template #header let-columns>
                  <tr>
                    @for (col of cols; track $index) {
                      <th>{{ col.header }}</th>
                    }

                  </tr>
                </ng-template>
                <ng-template #body let-account let-rowData let-columns="columns">
                  <tr>
                    <td>{{ rowData.index }}</td>
                    <td>{{ rowData.month }}</td>
                    <td>{{ rowData.income | infinityToZero | currency:'':'' }}</td>
                    <td>{{ rowData.expense | infinityToZero | currency:'':'' }}</td>
                    <td
                      [ngClass]="{
                        'negative-balance': rowData.balance < 0,
                        'positive-balance': rowData.balance >= 0,
                      }"
                    >
                      {{ rowData.balance | infinityToZero | currency: '' : '' }}
                    </td>
                  </tr>
                </ng-template>
                <ng-template #footer>
                  <tr>
                    <td></td>
                    <td>
                      <div class="text-end text-amber-600 font-semibold">รวม:</div>
                    </td>
                    <td [ngClass]="{
                      'negative-balance': totalBalance < 0,
                      'positive-balance': totalBalance >= 0,
                      }">
                      {{ totalIncome | infinityToZero | currency:'':'' }}
                    </td>
                    <td [ngClass]="{
                      'negative-balance': totalBalance < 0,
                      'positive-balance': totalBalance >= 0,
                      }">
                      {{ totalExpense | infinityToZero | currency:'':'' }}
                    </td>
                    <td [ngClass]="{
                      'negative-balance': totalBalance < 0,
                      'positive-balance': totalBalance >= 0,
                      }">
                      {{ totalBalance | infinityToZero | currency:'':'' }}
                    </td>
                  </tr>
                </ng-template>
                <ng-template #emptymessage>
                  <tr>
                    <td colspan="6">
                      <p-message
                        severity="warn"
                        icon="pi pi-exclamation-circle"
                        text="ไม่พบข้อมูลรายการปี: {{showYear}}" styleClass="h-full"/>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </div>
        }
      </ng-container>
    }
  `,
  styles: `
  `
})
export class AccountsYearCalculateComponent implements OnInit {
  selectedYear = new FormControl();
  loading = signal(false);
  isMobile = signal(false);

  year: any[] = [];
  showYear: string = '';
  totalIncome: number = 0;
  totalExpense: number = 0;
  totalBalance: number = 0;

  cols: any[] = [
    {field: 'index', header: 'ลำดับ'},
    {field: 'month', header: 'เดือน'},
    {field: 'income', header: 'รายรับ', pipe: 'currency'},
    {field: 'expense', header: 'รายจ่าย', pipe: 'currency'},
    {field: 'balance', header: 'คงเหลือ', pipe: 'currency'},
  ];

  /** Observables สำหรับเก็บข้อมูลและแปลงข้อมูลให้เหมาะกับการแสดงผล */
  incomeExpenseSummary$: Observable<YearSummary> = of({}); // เก็บข้อมูลจาก service
  incomeExpenseSummaryArray$: Observable<any[]> = of([]); // แปลงข้อมูลเป็น array สำหรับ PrimeNG Data Table

  constructor(
    private incomeExpenseService: IncomeExpenseService,
    private selectService: SelectorService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {
    this.selectService.getYear().then((year) => {
      this.year = year;
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.isMobile.set(window.innerWidth < 768);
  }

  ngOnInit() {
    this.isMobile.set(window.innerWidth < 768);
  }

  searchAllYear() {
    this.showYear = this.selectedYear.value.label;

    /** สร้าง Observable ที่ดึงข้อมูลจาก service เมื่อค่า selectedYear เปลี่ยนแปลง */
    this.incomeExpenseSummary$ = this.selectedYear.valueChanges.pipe(
      startWith(this.selectedYear.value.label), // เริ่มต้นด้วยค่าปีที่กรอกเข้ามา
      tap(() => this.loading.set(true)),
      switchMap((year: number) =>
        this.incomeExpenseService.getIncomeExpenseSummary(year)
          .pipe(
            catchError((error: any) => {
              this.toastService.showError('Error', error.messages);
              this.loading.set(false);
              return of({});
            }),
          )
      ),
    );

    /** แปลงข้อมูลจาก incomeExpenseSummary$ ให้เป็น array */
    this.incomeExpenseSummaryArray$ = this.incomeExpenseSummary$.pipe(
      map((summary) => {
        const summaryArray = Object.entries(summary)
          .map(
            ([month, data], index) => ({
              month,
              ...data,
              index: index + 1,
            }),
          ); // map 2

        /** หาผลรวมของ income, expense, balance */
        this.totalIncome = summaryArray.reduce(
          (sum, item) => sum + item.income, 0
        );
        this.totalExpense = summaryArray.reduce(
          (sum, item) => sum + item.expense, 0
        );
        this.totalBalance = summaryArray.reduce(
          (sum, item) => sum + item.balance, 0
        );
        setInterval(() => {
          this.loading.set(false);
          this.cdr.detectChanges();
        }, 100);
        return summaryArray;
      }), // map 1
    ); // pipe
  }
}
