import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';
import { BloodPressure } from '../models/blood-pressure.model';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';
import { BloodService } from '../services/blood.service';
import { ToastService } from '../services/toast.service';
import { SharedModule } from '../shared/shared.module';
import { PrintDialogComponent } from './print-dialog.component';

@Component({
  selector: 'app-blood-time-period',
  standalone: true,
  imports: [SharedModule, ThaiDatePipe],
  template: `
    <div class="flex justify-content-center align-items-center h-15rem -mt-4">
      @if (loading) {
        <div class="loading-shade">
          <p-progressSpinner strokeWidth="4" ariaLabel="loading"/>
        </div>
      }
      <p-card [style]="{ 'min-width': '30vw' }">
        <p
          class="hidden md:flex justify-content-center text-gray-200 tasadith text-2xl -mt-4 xs:text-sm"
        >
          Blood Pressure Time Period
        </p>
        <form>
          <div class="flex">
            <div class="flex align-items-center justify-content-center w-full">
              <p-calendar
                [formControl]="selectedDates"
                [iconDisplay]="'input'"
                [showIcon]="true"
                selectionMode="range"
                inputId="icondisplay"
                name="date"
                appendTo="body"
                dateFormat="d M yy"
                (onSelect)="onSelect()"
                [readonlyInput]="true"
              ></p-calendar>
            </div>
          </div>
        </form>
      </p-card>
    </div>
    <div class="table-container justify-content-center -mt-3">
      <div class="card">
        @if (bloodPressureRecords$ | async; as bloods) {
          <div id="contentToConvert">
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
                    Blood Pressure Time Period
                  </span>
                  <span>
                    <p-button
                      (onClick)="showDialog(bloods)"
                      icon="pi pi-print"
                    />
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
                    {{ blood.morning.bp1 }}
                  </td>
                  <td>
                    {{ blood.morning.bp2 }}
                  </td>
                  <td>
                    {{ blood.evening.bp1 }}
                  </td>
                  <td>
                    {{ blood.evening.bp2 }}
                  </td>
                  <td class="no-print">
                    @if (admin) {
                      <i
                        class="pi pi-pen-to-square mr-2 ml-2 text-blue-400"
                        (click)="showDialog(blood)"
                      ></i>
                      <p-confirmPopup/>
                      <i class="pi pi-trash mr-2 ml-2 text-orange-600"></i>
                    } @else {
                      <i class="pi pi-lock text-100"></i>
                    }
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
          <!--/ #contentToConvert-->
        }
      </div>
    </div>
  `,
  styles: `
    .p-card-center {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }

    .p-calendar-center {
      width: 100%; /* สามารถปรับให้พอดีกับความต้องการได้ */
      text-align: center;
    }

    td {
      font-family: 'Sarabun', sans-serif !important;
      color: #a3a1a1;
    }
  `,
})
export class BloodTimePeriodComponent implements OnDestroy, OnInit {
  ref: DynamicDialogRef | undefined;
  selectedDates = new FormControl();
  bloodPressureRecords$: Observable<BloodPressure[]> | undefined;
  loading: boolean = false;
  admin: boolean = false;

  constructor(
    private dialogService: DialogService,
    private bloodService: BloodService,
    private message: ToastService,
  ) {
  }

  ngOnInit() {
  }

  onSelect() {
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
        this.message.showError(
          'Error',
          'วันเริ่มต้นกับวันสิ้นสุดต้องคนละวันกัน',
        );
        return;
      }

      this.loading = true;
      this.bloodPressureRecords$ = this.bloodService.getBloodsByDateRange(
        starter,
        ender,
      );
      this.loading = false;
    } else {
      console.log('Please select a valid date range.');
    }
  }

  ngOnDestroy() {
    if (this.ref) this.ref.destroy();
  }

  showDialog(blood: any) {
    this.ref = this.dialogService.open(PrintDialogComponent, {
      data: blood,
      header: 'Blood Pressure Print',
      width: '700px',
      breakpoints: {
        maxWidth: '90vw',
      },
    });
  }
}
