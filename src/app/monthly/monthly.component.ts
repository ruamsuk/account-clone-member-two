import { Component, DestroyRef, inject, OnDestroy, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Table } from 'primeng/table';
import { catchError, of } from 'rxjs';
import { Monthly } from '../models/monthly.model';
import { ChristianToThaiYearPipe } from '../pipe/christian-to-thai-year.pipe';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';
import { AuthService } from '../services/auth.service';
import { ConfirmService } from '../services/confirm.service';
import { MonthlyService } from '../services/monthly.service';
import { SelectorService } from '../services/selector.service';
import { ToastService } from '../services/toast.service';
import { SharedModule } from '../shared/shared.module';
import { CrudMonthlyComponent } from './crud-monthly/crud-monthly.component';

@Component({
  selector: 'app-monthly',
  standalone: true,
  imports: [SharedModule, ThaiDatePipe, ChristianToThaiYearPipe],
  template: `
    <div class="card">
      @if (loading()) {
        <div class="loading-shade">
          <p-progressSpinner strokeWidth="4" ariaLabel="loading"/>
        </div>
      }
      <div class="flex justify-center items-center">
        <div class="mt-2">
          <div
            class="hidden md:flex items-center justify-center"
          >
            <span
              class="font-thasadith text-blue-500 font-semibold text-base md:text-2xl "
            >
              กำหนดวันเริ่มและสิ้นสุดของเดือน
            </span>
          </div>
          <p-table
            #tb
            [value]="monthly"
            [rows]="10"
            [rowHover]="true"
            [rowsPerPageOptions]="[5, 10, 20, 30]"
            [paginator]="true"
            [globalFilterFields]="['details', 'remark']"
            [scrollable]="true"
            scrollHeight="800px"
            [tableStyle]="{ 'min-width': '40rem' }"
            styleClass="p-datatable-striped z-0"
          >
            <ng-template #caption>
              <div class="flex items-center justify-between">
                <span>
                  <p-button
                    (click)="showDialog(Monthly)"
                    [disabled]="!admin()"
                    size="small"
                    icon="pi pi-plus"
                  />
                </span>
                <p-iconField iconPosition="left" class="ml-auto">
                  <p-inputIcon>
                    <i class="pi pi-search"></i>
                  </p-inputIcon>
                  <input
                    pInputText
                    [formControl]="searchValue"
                    pTooltip="หาเดือน"
                    tooltipPosition="bottom"
                    placeholder="ค้นหา .."
                    type="text"
                    (input)="tb.filterGlobal(getValue($event), 'contains')"
                  />
                  @if (searchValue) {
                    <span class="icons" (click)="clear(tb)">
                      <i class="pi pi-times" style="font-size: 1rem"></i>
                    </span>
                  }
                </p-iconField>
              </div>
            </ng-template>
            <ng-template #header>
              <tr>
                <th pSortableColumn="month">
                  <div class="text-teal-300">
                    เดือน
                    <p-sortIcon field="เดือน"/>
                  </div>
                </th>
                <th pSortableColumn="year">
                  <div class="text-teal-300">
                    ปี
                    <p-sortIcon field="ปี"/>
                  </div>
                </th>
                <th>
                  <div class="text-teal-300">วันเริ่มต้น</div>
                </th>
                <th>
                  <div class="text-teal-300">วันสิ้นสุด</div>
                </th>
                <th>
                  <div class="text-teal-300">Action</div>
                </th>
                <th></th>
              </tr>
            </ng-template>
            <ng-template #body let-month>
              <tr>
                <td>{{ month.month }}</td>
                <td>{{ month.year | christianToThaiYear }}</td>
                <td>{{ month.datestart | thaiDate }}</td>
                <td>{{ month.dateend | thaiDate }}</td>
                <td>
                  @if (admin()) {
                    <i
                      pTooltip="แก้ไข"
                      (click)="showDialog(month)"
                      tooltipPosition="bottom"
                      class="pi pi-pen-to-square mr-2 ml-2 text-green-300"
                    ></i>
                    <p-confirmPopup/>
                    <i
                      pTooltip="ลบข้อมูล"
                      (click)="conf($event, month.id)"
                      tooltipPosition="bottom"
                      class="pi pi-trash text-red-400"
                    ></i>
                  }
                </td>
                <td></td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td
                  colspan="6"
                >
                  <p-message
                    severity="warn"
                    icon="pi pi-exclamation-circle"
                    text="ไม่พบข้อมูล" styleClass="h-full"/>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </div>
  `,
  styles: `
  `,
})
export class MonthlyComponent implements OnDestroy {
  searchValue = new FormControl();
  year: any[] = [];
  loading = signal(false);
  admin = signal(false);
  monthly: any[] = [];
  dialogService = inject(DialogService);
  ref: DynamicDialogRef | undefined;
  Monthly!: Monthly;
  private destroyRef = inject(DestroyRef);

  constructor(
    private authService: AuthService,
    private yearSearch: SelectorService,
    private monthlyService: MonthlyService,
    private messageService: ToastService,
    private confirmService: ConfirmService,
  ) {
    this.yearSearch.getYear().then((year) => {
      this.year = year;
    });
    this.getRole();
    this.getMonthly();
  }

  getMonthly() {
    this.loading.set(true);
    this.monthlyService
      .getSortedMonthlyData()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err: any) => {
          this.messageService.showError('Error', err.message);
          console.error(err);
          return of([]);
        }),
      )
      .subscribe((result: any[]) => {
        this.loading.set(false);
        this.monthly = result;
      });
  }

  getRole() {
    this.authService.isAdmin().subscribe((isAdmin) => {
      this.admin.set(isAdmin);
    });
  }

  showDialog(monthly: Monthly) {
    let header: string;
    if (monthly) {
      header = 'แก้ไขรายการ: ' + monthly.month;
    } else {
      header = 'เพิ่มรายการ';
    }
    this.ref = this.dialogService.open(CrudMonthlyComponent, {
      data: monthly,
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

  clear(table: Table) {
    table.clear();
    this.searchValue.reset();
  }

  getValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  conf(event: Event, id: string) {
    this.confirmService.confirm(
      event, id, this.monthlyService,
      this.monthlyService.deleteMonth.bind(this.monthlyService),
      () => {
      },
      (error) => {
        console.log(error);
      },
    );
  }

  ngOnDestroy() {
    if (this.ref) this.ref.destroy();
  }
}
