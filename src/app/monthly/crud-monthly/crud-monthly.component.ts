import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
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
    <form [formGroup]="monthlyForm" (ngSubmit)="saveMonthly()">
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
            (click)="close()"
          />
          <p-button
            label="Save"
            [disabled]="monthlyForm.invalid"
            styleClass="w-full"
            class="w-full"
            (click)="saveMonthly()"
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
      value: 'มกราคม',
    }, Validators.required),
    year: new FormControl({
      label: new Date().getFullYear() + 543,
      parent: undefined,
    }, Validators.required),
    datestart: new FormControl('', Validators.required),
    dateend: new FormControl('', Validators.required),
  });

  constructor(
    private ref: DynamicDialogRef,
    private monthlyData: DynamicDialogConfig,
    private message: ToastService,
    private monthlyService: MonthlyService,
    private selectService: SelectorService,
  ) {
    if (this.monthlyData.data) {
      /**
       * 1. ค่า month ที่ส่งมาเป็น array {'label': 'ชื่อเดือน', 'value': 'ชื่อเดือน'}
       *    ต้องเอาทั้ง label, value ซึ่งเป็นชื่อเดือนทั้งคู่
       * 2. ปีที่ส่งมาเป็นปี ค.ศ.และเป็น array เหมือน month ต้องแปลงเป็นปี พ.ศ.เพื่อแสดงใน UI
       * 3. datestart, dateend ต้องแปลงเป็น Date object
       * 4. ต้องแปลงปี พ.ศ. เป็น ค.ศ. โดยการลบด้วย 543 ก่อนบันทึก
       * 5. id ต้องส่งไปด้วยเพื่อใช้ในการแก้ไขข้อมูล
       * 6. ถ้าไม่แปลงปี พ.ศ. เป็น ค.ศ. จะทำให้การบันทึกข้อมูลไม่ถูกต้อง
       * 7. และเมื่อเรียกข้อมูลมาแก้ไข ก็จะผิดพลาดเพราะจะลบ 543 ในปี ค.ศ.อีก
       * */
      this.monthlyForm.patchValue({
        id: this.monthlyData.data.id,
        month: {
          label: this.monthlyData.data.month,
          value: this.monthlyData.data.month,
        },
        year: {
          label: Number(this.monthlyData.data.year) + 543,
          parent: this.monthlyData.data.year,
        },
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

  saveMonthly() {
    if (this.monthlyForm.invalid) return;

    const monthly = this.monthlyForm.value;
    const convertedYear = Number(monthly.year?.label) - 543;
    const dataToSave = {
      ...monthly,
      year: convertedYear,
    };

    if (monthly.id) {
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
