import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';
import { BloodPressure } from '../models/blood-pressure.model';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';
import { AuthService } from '../services/auth.service';
import { BloodService } from '../services/blood.service';
import { ConfirmService } from '../services/confirm.service';
import { SharedModule } from '../shared/shared.module';
import { BloodAddEditComponent } from './blood-add-edit.component';
import { PrintDialogComponent } from './print-dialog.component';

@Component({
  selector: 'app-blood-year-period',
  standalone: true,
  imports: [SharedModule, ThaiDatePipe],
  template: `
    @if (loading()) {
      <div class="loading-shade">
        <p-progressSpinner strokeWidth="4" ariaLabel="loading"/>
      </div>
    }
    <div class="flex  flex-wrap p-fluid justify-center items-center">
      <p-card>
        <div
          class="text-center font-thasadith font-semibold text-base md:text-xl -mt-3 mb-2"
        >
          <span class="text-indigo-400">
          Blood Pressure Year Period
          </span>
        </div>
        <div class="card flex justify-center mt-5">
          <form>
            <div class="flex grow">
              <p-floatLabel variant="on">
                <p-treeSelect
                  [formControl]="startYear"
                  [options]="years"
                  (onNodeSelect)="onStartYearSelect($event)"
                  containerStyleClass="w-full"
                />
                <label for="treeSelect">เลือกปีเริ่มต้น</label>
              </p-floatLabel>
              <div class="flex grow ml-2">
                <p-floatLabel variant="on">
                  <p-treeSelect
                    [formControl]="endYear"
                    [options]="years"
                    (onNodeSelect)="onEndYearSelect($event)"
                    containerStyleClass="w-full"
                  />
                  <label for="treeSelect">เลือกปีสิ้นสุด</label>
                </p-floatLabel>
              </div>
            </div>
          </form>
        </div>
      </p-card>
    </div>
    <div class="table-container justify-center mt-2">
      <div class="card">
        @if (bloodPressureRecords$ | async; as bloods) {
          <p-table
            #bp
            [value]="bloods"
            [paginator]="true"
            [rows]="5"
            [rowHover]="true"
            [breakpoint]="'960px'"
            [tableStyle]="{ 'min-width': '50rem' }"
            responsiveLayout="stack"
            showGridlines
          >
            <ng-template #caption>
              <div class="flex justify-between items-center">
                <span class="font-thasadith font-semibold text-orange-300 text-xl">
                  Blood Pressure Year Period
                </span>
                <span>
                  <p-button (onClick)="showPrint(bloods)" icon="pi pi-print"/>
                </span>
              </div>
            </ng-template>
            <ng-template #header>
              <tr>
                <th rowspan="3" style="width: 20%">
                  <div class="ml-5">Date.</div>
                </th>
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
                      'normal-bp': !isBloodPressureHigh(blood.morning.bp1),
                    }"
                  >
                    {{ blood.evening.bp1 }}
                  </div>
                </td>
                <td>
                  <div
                    [ngClass]="{
                      'high-bp': isBloodPressureHigh(blood.evening.bp2),
                      'normal-bp': !isBloodPressureHigh(blood.morning.bp1),
                    }"
                  >
                    {{ blood.evening.bp2 }}
                  </div>
                </td>
                <td class="no-print">
                  @if (admin()) {
                    <i
                      class="pi pi-pen-to-square mr-2 ml-2 text-blue-400"
                      (click)="showDialog(blood)"
                    ></i>
                    <p-confirmPopup/>
                    <i
                      class="pi pi-trash mr-2 ml-2 text-orange-600"
                      (click)="confine($event, blood.id)"
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
    </div>
  `,
  styles: `
  `,
})
export class BloodYearPeriodComponent implements OnInit, OnDestroy {
  bloodPressureRecords$: Observable<BloodPressure[]> | undefined;
  ref: DynamicDialogRef | undefined;
  years: any[] = [];
  admin = signal(false);
  loading = signal(false);

  startYear = new FormControl();
  endYear = new FormControl();
  yearStart: number = 0;
  yearEnd: number = 0;

  constructor(
    private authService: AuthService,
    private bloodService: BloodService,
    private confirmService: ConfirmService,
    private dialogService: DialogService,
  ) {
  }

  ngOnInit() {
    const currentYear = new Date().getFullYear() + 543; // แปลงเป็นพุทธศักราช
    for (let i = 0; i < 5; i++) {
      this.years.push({label: `${currentYear - i}`, value: currentYear - i});
    }
    this.authService.isAdmin().subscribe((isAdmin) => {
      this.admin.set(isAdmin);
    });
  }

  ngOnDestroy() {
    if (this.ref) this.ref.destroy();
  }

  onStartYearSelect(event: any) {
    this.yearStart = event.node.value - 543;
    this.searchByYearRange();
  }

  onEndYearSelect(event: any) {
    this.yearEnd = event.node.value - 543;
    this.searchByYearRange();
  }

  searchByYearRange() {
    if (this.yearStart && this.yearEnd) {
      this.loading.set(true);
      this.bloodPressureRecords$ = this.bloodService.getBloodsByYearRange(
        this.yearStart,
        this.yearEnd,
      );
      this.loading.set(false);
    }
  }

  showPrint(blood: any) {
    this.ref = this.dialogService.open(PrintDialogComponent, {
      data: blood,
      header: 'Blood Pressure Print',
      width: '700px',
      breakpoints: {
        maxWidth: '90vw',
      },
      closable: true,
    });
  }

  showDialog(blood: any) {
    let header = blood ? 'แก้ไขรายการ' : 'เพิ่มรายการ';

    this.ref = this.dialogService.open(BloodAddEditComponent, {
      data: blood,
      header: header,
      width: '360px',
      breakpoints: {
        '960px': '90vw',
        '640px': '90vw',
        '390px': '90vw',
      },
      closable: true,
    });
  }

  isBloodPressureHigh(bp: string): boolean {
    const [systolic, diastolic] = bp.split('/').map(Number);
    return systolic > 140 || diastolic > 90;
  }

  confine(event: Event, id: string) {
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
