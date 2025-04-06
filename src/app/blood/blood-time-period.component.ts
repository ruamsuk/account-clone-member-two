import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';
import { BloodPressure } from '../models/blood-pressure.model';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';
import { AuthService } from '../services/auth.service';
import { BloodService } from '../services/blood.service';
import { ToastService } from '../services/toast.service';
import { SharedModule } from '../shared/shared.module';
import { PrintDialogComponent } from './print-dialog.component';

@Component({
  selector: 'app-blood-time-period',
  standalone: true,
  imports: [SharedModule, ThaiDatePipe],
  template: `
    @if (loading()) {
      <div class="loading-shade">
        <p-progressSpinner strokeWidth="4" ariaLabel="loading"/>
      </div>
    }
    <div class="flex flex-wrap p-fluid justify-center items-center mt-2 m-5">
      <p-card>
        <div
          class="text-center text-gray-200 font-thasadith text-base md:text-2xl -mt-3 mb-2"
        >
          Blood Pressure Time Period
        </div>
        <form>
          <div class="flex-auto">
            <p-floatlabel variant="on">
              <p-datePicker
                [formControl]="selectedDates"
                [iconDisplay]="'input'"
                [showIcon]="true"
                [readonlyInput]="true" (onSelect)="onSelect()"
                selectionMode="range" styleClass="w-[250px]"/>
              <label for="on_label">วันเริ่มต้น - วันสิ้นสุด</label>
            </p-floatlabel>
          </div>
        </form>
      </p-card>
    </div>
    <div class="table-container justify-center">
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
              showGridlines
            >
              <ng-template #caption>
                <div class="flex justify-between items-center">
                  <span class="font-thasadith text-orange-300 text-xl font-semibold">
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
                    @if (admin()) {
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
  `,
})
export class BloodTimePeriodComponent implements OnDestroy, OnInit {
  ref: DynamicDialogRef | undefined;
  selectedDates = new FormControl();
  bloodPressureRecords$: Observable<BloodPressure[]> | undefined;
  loading = signal(false);
  admin = signal(false);

  constructor(
    private authService: AuthService,
    private dialogService: DialogService,
    private bloodService: BloodService,
    private message: ToastService,
  ) {
  }

  ngOnInit() {
    this.authService.isAdmin().subscribe(isAdmin => {
      this.admin.set(isAdmin);
    });
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

      this.loading.set(true);
      this.bloodPressureRecords$ = this.bloodService.getBloodsByDateRange(
        starter,
        ender,
      );
      this.loading.set(false);
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
