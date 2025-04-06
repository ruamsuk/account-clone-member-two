import { ChangeDetectorRef, Component, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Table } from 'primeng/table';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Credit } from '../models/credit.model';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';
import { AuthService } from '../services/auth.service';
import { ConfirmService } from '../services/confirm.service';
import { CreditService } from '../services/credit.service';
import { SharedModule } from '../shared/shared.module';
import { CreditDetailComponent } from './credit-detail.component';
import { CreditComponent } from './credit.component';

@Component({
  selector: 'app-credit-list',
  imports: [SharedModule, ThaiDatePipe],
  template: `
    @if (loading()) {
      <div class="loading-shade">
        <p-progressSpinner strokeWidth="4" ariaLabel="loading"/>
      </div>
    }
    @if (getCredit()) {
      <div class="table-container mt-3">
        <p-table
          #tb
          [value]="getCredit()"
          [paginator]="true"
          [rowHover]="true"
          [rows]="10"
          [globalFilterFields]="['details', 'remark']"
          [tableStyle]="{ 'min-width': '40rem'}"
          responsiveLayout="scroll">
          <ng-template #caption>
            <div class="flex items-center justify-between">
              <span>
                <p-button
                  (click)="showDialog('')"
                  [disabled]="!isAdmin()"
                  size="small"
                  icon="pi pi-plus"
                  pTooltip="เพื่มรายการเครดิต"/>
              </span>
              <span class="hidden md:block font-thasadith text-green-400 text-lg md:text-2xl ml-auto">
                รายการบัตรเครดิต
              </span>
              <p-iconfield iconPosition="left" styleClass="ml-auto">
                <p-inputicon>
                  <i class="pi pi-search"></i>
                </p-inputicon>
                <input
                  pInputText
                  [formControl]="searchValue"
                  pTooltip="รายการ, หมายเหตุ"
                  tooltipPosition="bottom"
                  placeholder="ค้นหา..."
                  (input)="tb.filterGlobal(getValue($event), 'contains')"/>
                @if (searchValue.value) {
                  <span class="icons" (click)="clear(tb)">
                    <i class="pi pi-times cursor-pointer"></i>
                  </span>
                }
              </p-iconfield>
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
              <th [ngClass]="{'hide-on-mobile': isMobile()}">*</th>
            </tr>
          </ng-template>
          <ng-template #body let-credit let-i="rowIndex">
            <tr>
              <td [ngClass]="{ isIncome: credit.isCashback}">
                {{ i + 1 + currentPage * rowsPerPage }}
              </td>
              <td [ngClass]="{ isIncome: credit.isCashback }">
                {{ credit.date | thaiDate }}
              </td>
              <td [ngClass]="{ isIncome: credit.isCashback }">
                {{ credit.details }}
              </td>
              <td [ngClass]="{ isIncome: credit.isCashback, 'hide-on-mobile': isMobile() }">
                {{ credit.amount | currency:'':'' }}
              </td>
              <td [ngClass]="{ isIncome: credit.isCashback, 'hide-on-mobile': isMobile() }">
                {{ credit.remark }}
              </td>
              <td [ngClass]="{ isIncome: credit.isCashback }">
                <i
                  pTooltip="รายละเอียด"
                  (click)="onDetail(credit)"
                  tooltipPosition="bottom"
                  class="pi pi-list text-blue-400"
                ></i>
                @if (isAdmin()) {
                  <i pTooltip="แก้ไข"
                     (click)="showDialog(credit)"
                     tooltipPosition="bottom"
                     class="pi pi-pen-to-square text-green-300 mx-3"
                  ></i>
                  <p-confirmPopup/>
                  <i pTooltip="ลบข้อมูล"
                     (click)="deleteCredit($event, credit.id)"
                     tooltipPosition="bottom"
                     class="pi pi-trash text-red-400"
                  ></i>
                }
              </td>
              <td [ngClass]="{ isIncome: credit.isCashback, 'hide-on-mobile': isMobile() }">
                @if (credit.isCashback) {
                  <span class="flex items-start">
                  เงินคืน
                </span>
                }
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    }

  `,
  styles: ``
})
export class CreditListComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  creditService = inject(CreditService);
  dialogService = inject(DialogService);

  currentPage = 0;
  rowsPerPage = 10;

  credits!: Credit[];
  dialogRef: DynamicDialogRef | undefined;
  searchValue = new FormControl('');
  loading = signal(true);
  isAdmin = signal(false);
  isMobile = signal(false);

  getCredit = toSignal(
    (this.creditService.loadCredit() as Observable<Credit[]>)
      .pipe(
        tap(() => {
          this.loading.set(false);
        }),
        catchError((err: any) => {
          this.loading.set(false);
          return throwError(() => err);
        })
      ),
    {
      initialValue: [],
    }
  );

  constructor(
    private cdr: ChangeDetectorRef,
    private confirmService: ConfirmService,
  ) {
    this.getRole();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.isMobile.set(window.innerWidth < 768);
  }

  getRole() {
    this.authService.isAdmin().subscribe(isAdmin => {
      this.isAdmin.set(isAdmin);
    });
  }

  getValue(event: Event): string {
    return (event?.target as HTMLInputElement).value;
  }

  showDialog(credit: any) {
    let header = credit ? 'Edit Credit' : 'Add new credit';
    this.dialogRef = this.dialogService.open(CreditComponent, {
      data: credit,
      header: header,
      width: '360px',
      contentStyle: {overflow: 'auto'},
      breakpoints: {
        '960px': '360px',
        '640px': '360px',
        '390px': '385px',
      },
      closable: true,
    });

  }

  onDetail(credit: any) {
    this.dialogRef = this.dialogService.open(CreditDetailComponent, {
      data: credit,
      header: 'Credit detail',
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

  deleteCredit(event: Event, id: string) {
    this.confirmService.confirm(
      event,
      id,
      this.creditService,
      this.creditService.deleteCredit.bind(this.creditService),
      () => {
        /** ไม่ต้องมีก็ได้ แต่ทำไว้จาม AI แนะนำ */
      },
      (error) => {
        console.log(error);
      }
    );
  }

  ngOnDestroy(): void {
    if (this.dialogRef) this.dialogRef.destroy();
  }

  ngOnInit(): void {
    this.isMobile.set(window.innerWidth < 768);
  }
}
