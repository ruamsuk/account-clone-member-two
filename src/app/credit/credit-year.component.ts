import { ChangeDetectorRef, Component, DestroyRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { SearchYearService } from '../services/search-year.service';
import { SelectorService } from '../services/selector.service';
import { ToastService } from '../services/toast.service';
import { SharedModule } from '../shared/shared.module';

interface YearOption {
  label: number;
}

interface YearResults {
  resultsE: { [key: string]: number };
  maxMonth: string;
  minMonth: string;
  avg: number;
  totalExpenses: number;
  totalCashback: number;
  min: number;
  max: number;
}

@Component({
  selector: 'app-credit-year',
  imports: [SharedModule],
  template: `
    @if (loading()) {
      <div class="loading-shade">
        <p-progressSpinner strokeWidth="4" ariaLabel="loading"/>
      </div>
    }
    <div class="flex flex-wrap p-fluid justify-center items-center mt-2">
      <p-card>
        <div class="text-center font-thasadith text-orange-200 text-base md:text-2xl -mt-3 mb-2 px-2">
          เครดิตตลอดทั้งปี
        </div>
        <div class="flex justify-center">
          <p-floatlabel variant="on" class="w-full">
            <p-treeSelect
              class="w-full"
              containerStyleClass="w-full"
              [formControl]="searchYear"
              [options]="year"
              (onNodeSelect)="yearSearch()"
            />
            <label for="on_label">เลือกปี</label>
          </p-floatlabel>
        </div>
      </p-card>
    </div>
    @if (data.length > 0) {
      <ng-container>
        <div class="flex justify-center items-center mt-3">
          <p-card>
            <div class="overflow-x-auto overflow-y-hidden w-96">
              <p-table
                [value]="data"
                [rowHover]="true"
                [tableStyle]="{ 'min-width': '384px'}"
              >
                <ng-template #caption>
                  <div class="flex justify-between">
                <span class="text-orange-400 font-thasadith font-bold text-base md:text-2xl">
                        เครดิตในรอบปี:
                        <span class="ml-2 text-green-400 text-base md:text-xl">
                          {{ showYear }}
                        </span>
                      </span>
                    <p-button icon="pi pi-refresh"/>
                  </div>
                </ng-template>
                <ng-template #header>
                  <tr>
                    <th>
                      <div class="text-teal-300">เดือน</div>
                    </th>
                    <th>
                      <div class="text-teal-300">จำนวนเงิน</div>
                    </th>
                  </tr>
                </ng-template>
                <ng-template #body let-result>
                  <tr>
                    <td>{{ result.month }}</td>
                    <td>{{ result.total | currency:'':'' }}</td>
                  </tr>
                </ng-template>
                <ng-template #emptymessage>
                  <td colspan="6">
                    <p-message
                      severity="warn"
                      icon="pi pi-exclamation-circle"
                      text="ไม่พบข้อมูลรายการปี: {{showYear}}" styleClass="h-full"/>
                  </td>
                </ng-template>
                <ng-template #summary>
                  <hr class="h-px bg-gray-300 border-0"/>
                  <div class="flex justify-start font-thasadith text-amber-200 font-semibold text-base md:text-xl mt-3">
                    ผลสรุปการใช้จ่าย
                  </div>
                  <table class="w-full font-thasadith text-base md:text-xl mt-5">
                    <tbody>
                    <tr>
                      <th class="text-teal-500 text-right pr-3">เป็นเงิน:</th>
                      <td class="text-amber-400 text-right">{{ totalExpense | currency:'':'' }}</td>
                      <td class="text-teal-500 text-left font-semibold pl-3">บาท</td>
                    </tr>
                    <tr>
                      <th class="text-teal-500 text-right pr-3">เงินคืน:</th>
                      <td class="text-sky-300 text-right">{{ totalCashback | currency:'':'' }}*</td>
                      <td class="text-teal-500 text-left font-semibold pl-3">บาท</td>
                    </tr>
                    <tr>
                      <th class="text-teal-500 text-right pr-3">ยอดดุล:</th>
                      <td class="text-sky-300 text-right">{{ balance | currency:'':'' }}</td>
                      <td class="text-teal-500 text-left font-semibold pl-3">บาท</td>
                    </tr>
                    <tr>
                      <th class="text-teal-500 text-right pr-3">มากสุด:</th>
                      <td class="text-amber-400 text-right">{{ maxMountExpense }}: {{ maxAmount | currency:'':'' }}</td>
                      <td class="text-teal-500 text-left font-semibold pl-3">บาท</td>
                    </tr>
                    <tr>
                      <th class="text-teal-500 text-right pr-3">น้อยสุด:</th>
                      <td class="text-amber-400 text-right">{{ minMonthExpense }}: {{ minAmount | currency:'':'' }}</td>
                      <td class="text-teal-500 text-left font-semibold pl-3">บาท</td>
                    </tr>
                    <tr>
                      <th class="text-teal-500 text-right pr-3">เฉลี่ย:</th>
                      <td class="text-amber-400 text-right">{{ averageAmount | currency:'':'' }}</td>
                      <td class="text-teal-500 text-left font-semibold pl-3">บาท</td>
                    </tr>
                    </tbody>
                    <tfoot>
                    <tr>
                      <td colspan="3">
                        <p-message
                          severity="secondary"
                          icon="pi pi-info-circle"
                          text="หมายเหตุ">
                          *เงินคืนอาจเป็นการยกเลิกรายการจ่ายก็ได้
                        </p-message>
                      </td>
                    </tr>
                    </tfoot>
                  </table>
                </ng-template>
              </p-table>
            </div>
          </p-card>
        </div>
      </ng-container>
    }

  `,
  styles: `
    table td,
    table th {
      border-bottom: #919191 1px solid;
      padding: 0.25rem;
    }
  `
})
export class CreditYearComponent implements OnInit {
  toastService = inject(ToastService);
  selectService = inject(SelectorService);
  searchYearService = inject(SearchYearService);

  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  searchYear = new FormControl<YearOption | null>(null);
  data: { month: string; total: number }[] = [];
  year: any[] = [];
  results: { [key: string]: number } = {}; // assuming resultsE is an object with key-value pairs
  totalExpense = 0;
  totalCashback = 0;
  balance: number = 0;
  averageAmount: number = 0;
  minAmount: number = 0; // จำนวนเงิน
  maxAmount: number = 0; //    "
  minMonthExpense: string = ''; // ชื่อเดือน
  maxMountExpense: string = ''; //   "
  showYear: any;
  loading = signal(false);
  isMobile = signal(false);

  /** This is redundant, but we're keeping it as an example. */
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.isMobile.set(window.innerWidth < 768);
  }

  ngOnInit(): void {
    this.isMobile.set(window.innerWidth < 768);

    this.selectService.getYear().then((year) => {
      this.year = year;
    });

  }

  yearSearch() {
    const selectedYear = this.searchYear.value;
    if (selectedYear) {
      const year = selectedYear.label - 543;
      this.showYear = this.searchYear.value?.label;

      this.loading.set(true);

      this.searchYearService
        .loadYear(year)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (result: YearResults) => {
            this.data = Object.keys(result.resultsE).map((key) => ({
              month: key,
              total: result.resultsE[key],
            }));
            this.maxMountExpense = result.maxMonth;
            this.minMonthExpense = result.minMonth;
            this.averageAmount = result.avg;
            this.totalExpense = result.totalExpenses;
            this.totalCashback = result.totalCashback;
            this.minAmount = result.min;
            this.maxAmount = result.max;
            this.results = result.resultsE; // to show table
            this.calculateBalance();
          },
          error: (err) => {
            this.loading.set(false);
            this.toastService.showError('Error', `Error: ${err}`);
          },
          complete: () =>
            setTimeout(() => {
              this.loading.set(false);
              this.cdr.detectChanges();
            }, 100),
        });
    }
  }

  calculateBalance() {
    this.balance = this.totalExpense - this.totalCashback;
  }
}
