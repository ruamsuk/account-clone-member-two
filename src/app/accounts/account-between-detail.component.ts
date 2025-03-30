import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { catchError, debounceTime, distinctUntilChanged, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import { Account } from '../models/account.model';
import { AccountsService } from '../services/accounts.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { SharedModule } from '../shared/shared.module';

@Component({
  selector: 'app-account-between-detail',
  imports: [
    SharedModule
  ],
  template: `
    @if (loading()) {
      <div class="loading-shade">
        <p-progressSpinner strokeWidth="4" ariaLabel="loading"/>
      </div>
    }
    <div class="flex flex-wrap p-fluid justify-center items-center mt-2">
      <p-card>
        <div class="text-center font-thasadith text-base md:text-2xl -mt-3 mb-2">
          <span class="text-slate-300 font-semibold">รายการตามช่วงเวลาและรายการ</span>
        </div>
        <div class="card flex flex-wrap gap-2 md:gap-4">
          <p-floatlabel variant="on">
            <p-datePicker
              [formControl]="selectedDates"
              [iconDisplay]="'input'"
              [showIcon]="true"
              [readonlyInput]="true"
              selectionMode="range" styleClass="w-[250px]"/>
            <label for="on_label">วันเริ่มต้น-วันสิ้นสุด</label>
          </p-floatlabel>
          <p-iconfield>
            <input
              type="text"
              pInputText
              name="detail" placeholder="รายการ"
              [formControl]="searchDetail"/>
            <p-inputicon styleClass="pi pi-book"/>
          </p-iconfield>
        </div>
      </p-card>
    </div>

  `,
  styles: ``
})
export class AccountBetweenDetailComponent implements OnInit {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  accountsService = inject(AccountsService);
  confirmService = inject(ConfirmationService);
  dialogService = inject(DialogService);

  selectedDates = new FormControl();
  searchDetail = new FormControl();
  dialogRef: DynamicDialogRef | undefined;

  account!: Account[];
  totalExpenses!: Account[];
  title: string = '';
  loading = signal(false);
  isAdmin = signal(false);

  results$: Observable<any> = new Observable();

  ngOnInit(): void {
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
      selectedDates[1]
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
          }),
          catchError((err: any) => {
            this.loading.set(false);
            this.toastService.showError('Error', err.message);
            console.log(err.message);
            return throwError(() => err);
          })
        );
    }
    return of(null);
  }

  confirm(event: Event, id: string) {
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
