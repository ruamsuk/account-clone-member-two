import { Component, DestroyRef, OnDestroy, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Table } from 'primeng/table';
import { catchError, Observable, of } from 'rxjs';
import { BloodPressure } from '../models/blood-pressure.model';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';
import { AuthService } from '../services/auth.service';
import { BloodService } from '../services/blood.service';
import { ConfirmService } from '../services/confirm.service';
import { ToastService } from '../services/toast.service';
import { SharedModule } from '../shared/shared.module';
import { BloodAddEditComponent } from './blood-add-edit.component';

@Component({
  selector: 'app-blood-list',
  standalone: true,
  imports: [SharedModule, ThaiDatePipe],
  template: `
    @if (loading()) {
      <div class="loading-shade">
        <p-progressSpinner strokeWidth="4" ariaLabel="loading"/>
      </div>
    }
    <div class="table-container">
      @if (bloods$ | async; as bloods) {
        <p-table
          #bp
          [value]="bloods"
          [paginator]="true"
          [globalFilterFields]="['date']"
          [rows]="8"
          [rowHover]="true"
          [breakpoint]="'960px'"
          [tableStyle]="{ 'min-width': '50rem' }"
          responsiveLayout="scroll"
          showGridlines
        >
          <ng-template #caption>
            <div class="flex items-center justify-between">
                <span>
                  <p-button
                    (click)="showDialog('')"
                    [disabled]="!admin"
                    size="small"
                    icon="pi pi-plus"
                  />
                </span>
              <span
                class="hidden md:block font-thasadith font-semibold text-green-400 text-3xl ml-auto"
              >
                  Bloods Pressure List
                </span>
              <p-iconField iconPosition="left" class="ml-auto">
                <p-inputIcon>
                  <i class="pi pi-search"></i>
                </p-inputIcon>
                <input
                  class="sarabun"
                  pInputText
                  [formControl]="searchControl"
                  pTooltip="Search Date."
                  tooltipPosition="bottom"
                  placeholder="Search Date .."
                  type="text"
                  (input)="bp.filterGlobal(getValue($event), 'contains')"
                />
                @if (searchControl.value) {
                  <span class="icons cursor-pointer" (click)="clear(bp)">
                      <i class="pi pi-times" style="font-size: 1rem"></i>
                    </span>
                }
              </p-iconField>
            </div>
          </ng-template>
          <ng-template #header>
            <tr>
              <th rowspan="3" style="width: 20%">Date.</th>
            </tr>
            <tr>
              <th
                colspan="2"
                style="width: 20%"
              >
                <div class="text-center text-green-400">
                  Morning
                  <p class="text-center text-gray-600">
                    (Before medicine)
                  </p>
                </div>
              </th>
              <th
                colspan="2"
                style="width: 20%"
              >
                <div class="text-center text-yellow-400">
                  Evening
                  <p class="text-center text-gray-600">
                    (After medicine )
                  </p>
                </div>
              </th>
              <th></th>
            </tr>
            <tr>
              <th style="width: 15%">
                <div class="text-green-400">BP1</div>
              </th>
              <th style="width: 15%">
                <div class="text-green-400">BP2</div>
              </th>
              <th style="width: 15%">
                <div class="text-yellow-400">BP1</div>
              </th>
              <th style="width: 15%">
                <div class="text-yellow-400">BP2</div>
              </th>
              <th style="width: 15%">
                <div class="text-teal-400">Action</div>
              </th>
            </tr>
          </ng-template>
          <ng-template #body let-blood let-i="rowIndex">
            <tr>
              <td>
                {{ blood.date | thaiDate }}
              </td>
              <td>
                <div
                  [ngClass]="{
                      'high-bp': isBloodPressureHigh(blood.morning.bp1),
                      'normal-bp': !isBloodPressureHigh(blood.morning.bp1),
                    }"
                >
                  {{ blood.morning.bp1 }}
                </div>
              </td>
              <td>
                <div
                  [ngClass]="{
                      'high-bp': isBloodPressureHigh(blood.morning.bp2),
                      'normal-bp': !isBloodPressureHigh(blood.morning.bp1),
                    }"
                >
                  {{ blood.morning.bp2 }}
                </div>
              </td>
              <td>
                <div
                  [ngClass]="{
                      'high-bp': isBloodPressureHigh(blood.evening.bp1),
                      'normal-bp': !isBloodPressureHigh(blood.evening.bp1),
                    }"
                >
                  {{ blood.evening.bp1 }}
                </div>
              </td>
              <td>
                <div
                  [ngClass]="{
                      'high-bp': isBloodPressureHigh(blood.evening.bp2),
                      'normal-bp': !isBloodPressureHigh(blood.evening.bp1),
                    }"
                >
                  {{ blood.evening.bp2 }}
                </div>
              </td>
              <td>
                @if (admin()) {
                  <i
                    class="pi pi-pen-to-square mr-2 ml-2 text-blue-400"
                    (click)="showDialog(blood)"
                  ></i>
                  <p-confirmPopup/>
                  <i
                    class="pi pi-trash mr-2 ml-2 text-orange-500"
                    (click)="confirm($event, blood.id)"
                  ></i>
                } @else {
                  <i class="pi pi-lock text-100"></i>
                }
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>
  `,
  styles: `
  `,
})
export class BloodListComponent implements OnInit, OnDestroy {
  ref: DynamicDialogRef | undefined;
  bloods$!: Observable<BloodPressure[]>;
  loading = signal(false);
  searchControl: FormControl;

  admin = signal(false);

  constructor(
    private authService: AuthService,
    private dialogService: DialogService,
    private bloodService: BloodService,
    private messageService: ToastService,
    private destroyRef: DestroyRef,
    private confirmService: ConfirmService
  ) {
    this.searchControl = new FormControl();
  }

  ngOnInit() {
    this.authService.isAdmin().subscribe((isAdmin) => {
      this.admin.set(isAdmin);
    });
    this.getBloodList();
  }

  getBloodList() {
    this.loading.set(true);

    this.bloods$ = this.bloodService.getBloods().pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError((error: Error) => {
        this.messageService.showError('Error', error.message);
        return of([]);
      }),
    );
    this.bloods$.subscribe({
      next: () => {
        this.loading.set(false);
      },
    });
  }

  /** */
  isBloodPressureHigh(bp: string): boolean {
    const [systolic, diastolic] = bp.split('/').map(Number);
    return systolic > 140 || diastolic > 90;
  }

  getValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  showDialog(blood: any) {
    let header = blood ? 'แก้ไขรายการ' : 'เพิ่มรายการ';

    this.ref = this.dialogService.open(BloodAddEditComponent, {
      data: blood,
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
    this.searchControl.reset();
  }

  ngOnDestroy() {
    if (this.ref) this.ref.close();
  }

  confirm(event: Event, id: string) {
    this.confirmService.confirm(
      event, id, this.bloodService,
      this.bloodService.deleteBlood.bind(this.bloodService),
      () => {
      },
      (error) => {
        console.log(error);
      },
    );
  }
}
