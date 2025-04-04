import { Component, inject, OnDestroy, OnInit, Renderer2, ViewChild, } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputMask } from 'primeng/inputmask';
import { TimeOptions } from '../models/blood-pressure.model';
import { BloodService } from '../services/blood.service';
import { ToastService } from '../services/toast.service';
import { SharedModule } from '../shared/shared.module';

@Component({
  selector: 'app-blood-add-edit',
  standalone: true,
  imports: [SharedModule],
  template: `
    <form [formGroup]="bpForm" (ngSubmit)="onSubmit()">
      <hr class="h-px bg-gray-200 border-0"/>
      <input type="hidden" name="hidden"/>
      <div class="card p-fluid flex flex-wrap gap-3 p-5">
        <div class="w-full">
          <span class="block mb-2"> Date </span>
          <p-datePicker
            [iconDisplay]="'input'"
            [showIcon]="true"
            appendTo="body"
            inputId="icondisplay"
            formControlName="date"
            name="date"
            styleClass="w-full"
            (onSelect)="onDateSelect()"
          />
        </div>
        <div class="w-full">
          <span class="mb-2 block">Morning </span>
          <input
            pInputText
            type="text"
            value="Morning"
            readonly
            tabindex="-1"
            class="w-full"
            hidden="hidden"
          />
          <hr class="h-px bg-gray-200 border-0"/>
        </div>
        <div class="flex-grow-1" formGroupName="morning">
          <span class="mb-2 block sarabun">BP1 Morning </span>
          <p-inputMask
            #bp1Morning
            formControlName="bp1"
            mask="999/99 P99"
            placeholder="120/80 P60"
            styleClass="w-full"
            (onComplete)="moveFocus(bp2Morning)"
          ></p-inputMask>
        </div>
        <div class="w-full" formGroupName="morning">
          <span class="mb-2 block sarabun">BP2 Morning </span>
          <p-inputMask
            #bp2Morning
            formControlName="bp2"
            mask="999/99 P99"
            placeholder="120/80 P60"
            styleClass="w-full"
            (onComplete)="moveFocus(bp1Evening)"
          ></p-inputMask>
        </div>
        <div class="flex-auto">
          <span class="mb-2 block sarabun">Evening </span>
          <input
            pInputText
            type="text"
            value="Evening"
            readonly
            tabindex="-1"
            class="w-full"
            hidden="hidden"
          />
          <hr class="h-px bg-gray-200 border-0"/>
        </div>
        <div class="w-full" formGroupName="evening">
          <span class="mb-2 block sarabun">BP1 Evening </span>
          <p-inputMask
            #bp1Evening
            formControlName="bp1"
            mask="999/99 P99"
            placeholder="120/80 P60"
            styleClass="w-full"
            (onComplete)="moveFocus(bp2Evening)"
          ></p-inputMask>
        </div>
        <div class="w-full" formGroupName="evening">
          <span class="mb-2 block sarabun">BP2 Evening </span>
          <p-inputMask
            #bp2Evening
            formControlName="bp2"
            mask="999/99 P99"
            placeholder="120/80 P60"
            styleClass="w-full"
          ></p-inputMask>
        </div>
      </div>
      <!--/ card flex-->

      <div class="flex mt-5 mb-1 gap-2">
        <div class="grow">
          <p-button
            label="Cancel"
            severity="secondary"
            styleClass="w-full"
            class="w-full mr-2"
            (click)="close()"
          />
        </div>
        <div class="grow">
          <button [disabled]="bpForm.invalid"
                  [ngClass]="{
              'btn btn-disabled': bpForm.invalid,
              'btn btn-info': bpForm.valid,
              }" type="submit" class="w-full">
            Save
          </button>
        </div>
        <!--        <p-button-->
        <!--          label="Save"-->
        <!--          [disabled]="bpForm.invalid"-->
        <!--          styleClass="w-full"-->
        <!--          class="w-full"-->
        <!--          (click)="onSubmit()"-->
        <!--        />-->
      </div>
    </form>
  `,
  styles: ``,
})
export class BloodAddEditComponent implements OnInit, OnDestroy {
  @ViewChild('bp1Morning') bp1Morning: InputMask | undefined;
  @ViewChild('bp2Morning') bp2Morning: InputMask | undefined;
  @ViewChild('bp1Evening') bp1Evening: InputMask | undefined;
  @ViewChild('bp2Evening') bp2Evening: InputMask | undefined;

  bloodService = inject(BloodService);
  bpForm!: FormGroup;
  timeOptions: TimeOptions[] | undefined;

  constructor(
    private fb: FormBuilder,
    private ref: DynamicDialogRef,
    private config: DynamicDialogConfig,
    private message: ToastService,
    private renderer: Renderer2,
  ) {
    this.bpForm = this.fb.group({
      id: [''],
      date: [''],
      morning: this.fb.group({
        bp1: ['', Validators.required],
        bp2: ['', Validators.required],
      }),
      evening: this.fb.group({
        bp1: ['', Validators.required],
        bp2: ['', Validators.required],
      }),
    });
  }

  ngOnInit() {
    if (this.config.data) {
      const data = this.config.data;
      this.bpForm.patchValue({
        id: data.id,
        date: data.date.toDate(),
        morning: {
          bp1: data.morning.bp1,
          bp2: data.morning.bp2,
        },
        evening: {
          bp1: data.evening.bp1,
          bp2: data.evening.bp2,
        },
      });
    }

    this.timeOptions = [
      {name: 'เช้า', code: 'morning'},
      {name: 'เย็น', code: 'evening'},
    ];
  }

  onDateSelect() {
    setTimeout(() => {
      if (this.bp1Morning) {
        const inputElement =
          this.bp1Morning.el.nativeElement.querySelector('input');
        if (inputElement) {
          this.renderer.selectRootElement(inputElement).focus();
        }
      }
      this.bp1Morning?.el.nativeElement.focus();
    }, 0);
  }

  moveFocus(nextElement: InputMask): void {
    nextElement.focus();
  }

  onSubmit() {
    if (this.bpForm.invalid) {
      return;
    }
    // console.log(JSON.stringify(this.bpForm.value, null, 2));
    if (this.config.data) {
      // edit data
      const data = this.bpForm.value;
      this.bloodService.updateBlood(data.id, data).subscribe({
        error: (error) => {
          this.message.showError('Error', error.message);
          console.log(JSON.stringify(error, null, 2));
        },
        complete: () => {
          this.message.showSuccess(
            'Successfully',
            'Update Blood pressure successfully',
          );
          this.close();
        },
      });
    } else {
      // new record
      this.bloodService.createBlood(this.bpForm.value).subscribe({
        next: () => {
          this.message.showSuccess(
            'Successfully',
            'Create Blood pressure successfully',
          );
        },
        error: (error) => {
          this.message.showError('Error', error.message);
        },
        complete: () => this.close(),
      });
    }
  }

  ngOnDestroy() {
    if (this.ref) this.ref.destroy();
  }

  close() {
    this.ref.close();
  }
}
