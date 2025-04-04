import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Monthly } from '../../models/monthly.model';
import { MonthlyService } from '../../services/monthly.service';
import { SelectorService } from '../../services/selector.service';
import { ToastService } from '../../services/toast.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-crud-monthly',
  standalone: true,
  imports: [SharedModule],
  template: `
    <hr class="h-px bg-gray-200 border-0"/>
    <form [formGroup]="monthlyForm" (ngSubmit)="saveMonthly($event)">
      <input type="hidden"/>
      <div class="formgrid grid">
        <div class="field col my-3">
          <label for="treeSelect" class="ml-2">เดือน</label>
          <p-treeSelect
            class=""
            containerStyleClass="w-full"
            formControlName="month"
            [options]="_month"
            appendTo="body"
            placeholder="เลิอกเดือน"
          />
        </div>
        <div class="field col my-3">
          <label for="treeSelect" class="ml-2">ปี</label>
          <p-treeSelect
            class=""
            containerStyleClass="w-full"
            formControlName="year"
            [options]="year"
            appendTo="body"
            placeholder="เลิอกปี"
          />
        </div>
      </div>
      <div class="field">
        <label for="date">วันเริ่มต้น</label>
        <p-datePicker
          [iconDisplay]="'input'"
          [showIcon]="true"
          [inputStyle]="{ width: '90vw' }"
          appendTo="body"
          inputId="icondisplay"
          formControlName="datestart"
          name="datestart"
          class="w-full"
        />
      </div>
      <div class="field my-3">
        <label for="date">วันสิ้นสุด</label>
        <p-datePicker
          [iconDisplay]="'input'"
          [showIcon]="true"
          [inputStyle]="{ width: '90vw' }"
          appendTo="body"
          inputId="icondisplay"
          formControlName="dateend"
          name="dateend"
          class="w-full"
        />
      </div>
      <div class="field my-3">
        <hr class="h-px bg-gray-200 border-0 mb-1"/>
        <div class="flex mt-4 mb-1">
          <p-button
            label="Cancel"
            severity="secondary"
            styleClass="w-full"
            class="w-full mr-2"
            (onClick)="close()"
          />
          <p-button
            label="Save"
            [disabled]="monthlyForm.invalid"
            styleClass="w-full"
            class="w-full"
            (onClick)="saveMonthly($event)"
          />
        </div>
      </div>
      <p-confirmPopup/>
    </form>
  `,
  styles: `
  `,
})
export class CrudMonthlyComponent implements OnInit, OnDestroy {
  monthly!: Monthly;
  _month: any[] = [];
  year: any[] = [];
  monthlyForm = new FormGroup({
    id: new FormControl(null),
    month: new FormControl({
      label: 'มกราคม',
      parent: undefined,
    } as unknown as Monthly),
    year: new FormControl({
      label: new Date().getFullYear() + 543,
      parent: undefined,
    }, Validators.required),
    datestart: new FormControl('', Validators.required),
    dateend: new FormControl('', Validators.required),
  });

  constructor(
    private ref: DynamicDialogRef,
    private confirmService: ConfirmationService,
    private monthlyData: DynamicDialogConfig,
    private message: ToastService,
    private monthlyService: MonthlyService,
    private selectService: SelectorService,
  ) {
    if (this.monthlyData.data) {
      this.monthlyForm.patchValue({
        id: this.monthlyData.data.id,
        month: this.monthlyData.data.month.label,
        year: this.monthlyData.data.year.label,
        datestart: this.monthlyData.data.datestart.toDate(),
        dateend: this.monthlyData.data.dateend.toDate(),
      });
    }
    this.selectService.getMonth().then((month) => {
      this._month = month;
    });
    this.selectService.getYear().then((year) => {
      this.year = year;
    });
  }

  ngOnInit() {
  }

  saveMonthly(event: Event) {
    if (this.monthlyForm.invalid) return;

    const monthly = this.monthlyForm.value;
    const convertedYear = Number(monthly.year?.label) - 543;
    const dataToSave = {
      ...monthly,
      year: convertedYear,
    };

    if (monthly.id) {
      if (monthly.month == null) {
        console.log('monthly.month null');
        this.confirmService.confirm({
          target: event.target as EventTarget,
          message: 'ต้องเลือกเดือนอีกตรั้งก่อน!',
          icon: 'pi pi-exclamation-circle',
          acceptLabel: 'OK',
          acceptButtonStyleClass: 'p-button-sm',
          rejectVisible: false,
          accept: () => {
            return;
          },
        });
      } else {
        this.monthlyService.updateMonthly(dataToSave).subscribe({
          next: () =>
            this.message.showSuccess(
              'Successfully',
              'Updated monthly',
            ),
          error: (err) =>
            this.message.showError('Error', err.message),
          complete: () => this.close(),
        });
      }
    } else {
      this.monthlyService.addMonthly(dataToSave).subscribe({
        next: () =>
          this.message.showSuccess('Successfully', 'Saved monthly.'),
        error: (err) => this.message.showError('Error', err.message),
        complete: () => this.close(),
      });
    }
  }

  close() {
    this.ref.destroy();
  }

  ngOnDestroy() {
    if (this.ref) this.ref.destroy();
  }

}
