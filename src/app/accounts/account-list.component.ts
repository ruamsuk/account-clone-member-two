import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Table } from 'primeng/table';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Account } from '../models/account.model';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';
import { AccountsService } from '../services/accounts.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { SharedModule } from '../shared/shared.module';
import { AccountDetailComponent } from './account-detail.component';
import { AccountsComponent } from './accounts.component';

@Component({
  selector: 'app-account-list',
  imports: [SharedModule, ThaiDatePipe],
  template: `
    @if (loading()) {
      <div class="loading-shade">
        <p-progressSpinner strokeWidth="4" ariaLabel="loading"/>
      </div>
    }
    @if (getAccounts()) {
      <div class="table-container mt-3">
        <p-table
          #tb
          [value]="getAccounts()"
          [paginator]="true"
          [globalFilterFields]="['details', 'remark']"
          [rows]="10"
          [rowHover]="true"
          [tableStyle]="{ 'min-width': '40rem' }"
          responsiveLayout="scroll"
        >
          <ng-template #caption>
            <div class="flex items-center justify-content-between">
              <span>
                <p-button (click)="showDialog('')"
                          [disabled]="!admin()"
                          size="small" icon="pi pi-plus"
                          pTooltip="เพิ่มรายการบัญชี"/>
              </span>
              <span class="hidden md:block font-thasadith text-green-400 text-lg md:text-2xl ml-auto"
              >
                รายการบัญชีรับ/จ่าย
              </span>
              <p-iconField iconPosition="left" styleClass="ml-auto">
                <p-inputIcon>
                  <i class="pi pi-search"></i>
                </p-inputIcon>
                <input
                  class="sarabun"
                  pInputText
                  [formControl]="searchValue"
                  pTooltip="ค้นหา รายการ หมายเหตุ"
                  tooltipPosition="bottom"
                  placeholder="Search .."
                  type="text"
                  (input)="tb.filterGlobal(getValue($event), 'contains')"
                />
                @if (searchValue.value) {
                  <span class="icons" (click)="clear(tb)">
                      <i
                        class="pi pi-times cursor-pointer"
                        style="font-size: 1rem"
                      ></i>
                    </span>
                }
              </p-iconField>
            </div>
          </ng-template>
          <ng-template #header>
            <tr>
              <th style="width: 5%">#</th>
              <th>วันที่</th>
              <th>รายการ</th>
              <th [ngClass]="{'hide-on-mobile': isMobile()}">จำนวนเงิน</th>
              <th [ngClass]="{'hide-on-mobile': isMobile()}">หมายเหตุ</th>
              <th>Action</th>
              <th>*</th>
            </tr>
          </ng-template>
          <ng-template #body let-account let-i="rowIndex">
            <tr>
              <td [ngClass]="{ isIncome: account.isInCome }">
                {{ i + 1 + currentPage * rowsPerPage }}
              </td>
              <td [ngClass]="{ isIncome: account.isInCome }">
                {{ account.date | thaiDate }}
              </td>
              <td [ngClass]="{ isIncome: account.isInCome }">
                {{ account.details }}
              </td>
              <td [ngClass]="{ isIncome: account.isInCome, 'hide-on-mobile': isMobile() }">
                {{ account.amount | currency: '':'' }}
              </td>
              <td [ngClass]="{ isIncome: account.isInCome, 'hide-on-mobile': isMobile() }">
                {{ account.remark }}
              </td>
              <td [ngClass]="{ isIncome: account.isInCome }">
                <i
                  pTooltip="รายละเอียด" tooltipPosition="bottom"
                  class="pi pi-list text-blue-500"
                  (click)="onDetail(account)">
                </i>
                @if (admin()) {
                  <i
                    pTooltip="แก้ไข" tooltipPosition="bottom"
                    class="pi pi-pen-to-square text-yellow-500 mx-4"
                    (click)="showDialog(account)">
                  </i>
                  <p-confirmPopup/>
                  <i
                    pTooltip="ลบ" tooltipPosition="bottom"
                    class="pi pi-trash text-red-400"
                    (click)="confirmDelete($event, account.id)">
                  </i>
                }
              </td>
              <td [ngClass]="{ isIncome: account.isInCome }">
                @if (account.isInCome) {
                  <span class="flex justify-items-start">
                    รายรับ
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
export class AccountListComponent implements OnInit {
  private authService: AuthService = inject(AuthService);
  private accountsService: AccountsService = inject(AccountsService);
  private confirmService: ConfirmationService = inject(ConfirmationService);
  private dialogService: DialogService = inject(DialogService);
  private toastService = inject(ToastService);

  ref: DynamicDialogRef | undefined;
  searchValue = new FormControl('');
  currentPage = 0;
  rowsPerPage = 10;
  admin = signal(false);
  isMobile = signal(false);
  loading = signal(true);

  getAccounts = toSignal(
    (this.accountsService.loadAccounts() as Observable<Account[]>)
      .pipe(
        tap(() => {
          this.loading.set(false);
        }),
        catchError((err: any) => {
          this.toastService.showError('Error loading accounts', err);
          this.loading.set(false);
          return throwError(() => err);
        })
      ),
    {
      initialValue: [],
    }
  );

  ngOnInit() {
    this.isMobile.set(window.innerWidth < 768);
    this.chkRole();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.isMobile.set(window.innerWidth < 768);
  }

  private chkRole() {
    this.authService.isAdmin().subscribe(isAdmin => {
      this.admin.set(isAdmin);
    });
  }

  getValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  showDialog(account: any) {
    let header = account ? 'Edit Account' : 'Add Account';
    this.ref = this.dialogService.open(AccountsComponent, {
      data: account,
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

  clear(table: Table) {
    table.clear();
    this.searchValue.reset();
  }

  onDetail(account: any) {
    this.ref = this.dialogService.open(AccountDetailComponent, {
      data: account,
      header: 'Account Details',
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

  confirmDelete(event: Event, id: string) {
    this.confirmService.confirm({
      target: event.target as EventTarget,
      message: 'Do you want to delete this record?',
      icon: 'pi pi-info-circle',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: 'Delete',
        severity: 'danger'
      },
      accept: () => {
        this.accountsService.deleteAccount(id)
          .subscribe({
            next: () => this.toastService.showSuccess('Delete', 'Deleted Successfully'),
            error: err => this.toastService.showError('Error', err.message),
          });
      },
      reject: () => this.toastService.showInfo('Info Message', 'You have rejected')
    });
  }
}
