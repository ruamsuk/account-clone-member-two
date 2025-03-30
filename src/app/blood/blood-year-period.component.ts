import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';
import { BloodPressure } from '../models/blood-pressure.model';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';
import { AuthService } from '../services/auth.service';
import { BloodService } from '../services/blood.service';
import { MessagesService } from '../services/messages.service';
import { SharedModule } from '../shared/shared.module';
import { BloodAddEditComponent } from './blood-add-edit.component';
import { PrintDialogComponent } from './print-dialog.component';

@Component({
  selector: 'app-blood-year-period',
  standalone: true,
  imports: [SharedModule, FormsModule, ReactiveFormsModule, ThaiDatePipe],
  template: `
    <div class="flex justify-content-center align-items-center h-15rem -mt-4">
      @if (loading) {
        <div class="loading-shade">
          <p-progressSpinner strokeWidth="4" ariaLabel="loading"/>
        </div>
      }
      <p-card [style]="{ 'min-width': '30vw' }">
        <p
          class="hidden flex justify-content-center text-gray-200 tasadith text-2xl -mt-4 xs:text-sm"
        >
          Blood Pressure Year Period
        </p>
        <form>
          <div class="flex">
            <div class="flex align-items-center justify-content-center w-full">
              <p-floatLabel class="md:w-20rem w-full">
                <p-treeSelect
                  containerStyleClass="w-full"
                  [formControl]="startYear"
                  [options]="years"
                  (onNodeSelect)="onStartYearSelect($event)"
                  placeholder="เลือกปีเริ่มต้น"
                />
                <label for="treeSelect">เลือกปีเริ่มต้น</label>
              </p-floatLabel>

              <p-floatLabel class="md:w-20rem w-full">
                <p-treeSelect
                  containerStyleClass="w-full"
                  [formControl]="endYear"
                  [options]="years"
                  (onNodeSelect)="onEndYearSelect($event)"
                  placeholder="เลือกปีสิ้นสุด"
                />
                <label for="treeSelect">เลือกปีสิ้นสุด</label>
              </p-floatLabel>
            </div>
          </div>
        </form>
      </p-card>
    </div>
    <div class="table-container justify-content-center -mt-3">
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
            styleClass="p-datatable-gridlines"
          >
            <ng-template pTemplate="caption">
              <div class="flex justify-content-between align-items-center">
                <span class="tasadith text-orange-300 text-xl">
                  Blood Pressure Year Period
                </span>
                <span>
                  <p-button (onClick)="showPrint(bloods)" icon="pi pi-print"/>
                </span>
              </div>
            </ng-template>
            <ng-template pTemplate="header">
              <tr>
                <th rowspan="3" style="width: 20%">Date.</th>
              </tr>
              <tr>
                <th
                  colspan="2"
                  style="width: 20%"
                  class="text-center text-green-400"
                >
                  Morning<br/><span class="text-gray-600"
                >(Before medicine)</span
                >
                </th>
                <th
                  colspan="2"
                  style="width: 20%"
                  class="text-center text-yellow-400"
                >
                  Evening<br/><span class="text-gray-600"
                >(After medicine )</span
                >
                </th>
                <th></th>
              </tr>
              <tr>
                <th style="width: 15%" class="text-green-400">BP1</th>
                <th style="width: 15%" class="text-green-400">BP2</th>
                <th style="width: 15%" class="text-yellow-400">BP1</th>
                <th style="width: 15%" class="text-yellow-400">BP2</th>
                <th style="width: 15%" class="text-teal-400">Action</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-blood let-i="rowIndex">
              <tr>
                <!--<td>
                  {{ currentPage * rowsPerPage + i + 1 }}
                </td>-->
                <td>
                  <span class="p-column-title">Date</span>
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
                  @if (admin) {
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
    td {
      font-family: 'Sarabun', sans-serif !important;
      color: #a3a1a1;
    }

    .high-bp {
      color: red;
    }

    .normal-bp {
      color: inherit; /* หรือสีอื่นที่ต้องการ */
    }
  `,
})
export class BloodYearPeriodComponent implements OnInit, OnDestroy {
  bloodPressureRecords$: Observable<BloodPressure[]> | undefined;
  ref: DynamicDialogRef | undefined;
  years: any[] = [];
  admin: boolean = false;
  loading: boolean = false;

  startYear = new FormControl();
  endYear = new FormControl();
  yearStart: number = 0;
  yearEnd: number = 0;

  constructor(
    private authService: AuthService,
    private bloodService: BloodService,
    private confirmService: ConfirmationService,
    private dialogService: DialogService,
    private messageService: MessagesService,
  ) {
  }

  ngOnInit() {
    const currentYear = new Date().getFullYear() + 543; // แปลงเป็นพุทธศักราช
    for (let i = 0; i < 5; i++) {
      this.years.push({label: `${currentYear - i}`, value: currentYear - i});
    }
    this.authService.isAdmin().then((isAdmin) => {
      this.admin = isAdmin;
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
      this.loading = true;
      this.bloodPressureRecords$ = this.bloodService.getBloodsByYearRange(
        this.yearStart,
        this.yearEnd,
      );
      this.loading = false;
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
    });
  }

  isBloodPressureHigh(bp: string): boolean {
    const [systolic, diastolic] = bp.split('/').map(Number);
    return systolic > 140 || diastolic > 90;
  }

  confine(event: Event, morning: string) {
    this.confirmService.confirm({
      target: event.target as EventTarget,
      message: 'ต้องการลบรายการนี้ แน่ใจ?',
      header: 'Confirmation',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-warning p-button-sm',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.bloodService.deleteBlood(morning).subscribe({
          next: () => {
            this.messageService.addMessage(
              'warn',
              'Warning',
              'ลบข้อมูลเรียบร้อยแล้ว',
            );
          },
          error: (error: any) => {
            this.messageService.addMessage('error', 'Error', error.message);
          },
          complete: () => {
          },
        });
      },
      reject: () => {
        this.messageService.addMessage('warn', 'Warning', 'ยกเลิกการลบแล้ว!');
      },
    });
  }
}
