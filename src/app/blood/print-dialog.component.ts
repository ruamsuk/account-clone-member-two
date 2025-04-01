import { Component, OnDestroy } from '@angular/core';
import dayjs from 'dayjs';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import PizZip from 'pizzip';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ToastService } from '../services/toast.service';
import { SharedModule } from '../shared/shared.module';

interface Record {
  date: { toDate: () => Date };
  morning?: { bp1?: string; bp2?: string };
  evening?: { bp1?: string; bp2?: string };
}

@Component({
  selector: 'app-print-dialog',
  standalone: true,
  imports: [SharedModule],
  template: `
    <div class="flex justify-content-center">
      <h1 class="text-xl text-orange-400 tasadith">
        สร้างเอกสาร Word documents แล้ว โปรดบันทึกไฟล์
      </h1>
    </div>
    <div class="text-center mt-5">
      <p-button
        class="mr-2"
        label="Close"
        severity="secondary"
        size="small"
        (onClick)="ref.close()"
      ></p-button>
    </div>
  `,
  styles: `
  `,
})
export class PrintDialogComponent implements OnDestroy {
  mappedRecords: {
    no: number;
    date: string;
    morning_bp1: string;
    morning_bp2: string;
    evening_bp1: string;
    evening_bp2: string;
  }[] = [];

  constructor(
    public ref: DynamicDialogRef,
    private config: DynamicDialogConfig,
    private messageService: ToastService,
  ) {
    if (this.config.data && Array.isArray(this.config.data)) {
      const records: Record[] = this.config.data;
      this.mappedRecords = records.map((record, index) => ({
        no: index + 1,
        date: dayjs(record.date.toDate()).format('DD/MM/YYYY'),
        morning_bp1: record.morning?.bp1 || '',
        morning_bp2: record.morning?.bp2 || '',
        evening_bp1: record.evening?.bp1 || '',
        evening_bp2: record.evening?.bp2 || '',
      }));

      console.log(JSON.stringify(this.mappedRecords, null, 2));

      fetch('assets/template.docx')
        .then(response => {
          if (!response.ok) {
            throw new Error(`Template file not found ([${response.status}] ${response.statusText}) `);
          }
          return response.arrayBuffer();
        })
        .then(content => {
          const zip = new PizZip(content);
          const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true
          });

          doc.renderAsync({records: this.mappedRecords})
            .then(() => {
              const generateBlob = doc.getZip().generate({
                type: 'blob',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              });
              saveAs(generateBlob, 'BloodPressureReport.docx');
            })
            .catch(renderError => {
              console.error('⚠️ Error rendering document:', renderError);
              this.messageService.showError('Error', 'พบปัญหาในการสร้างเอกสาร กรุณาตรวจสอบ console');
            });
        })
        .catch(fetchError => {
          console.error('⚠️ Error:', fetchError);
          this.messageService.showError('Error', `หาไฟล์ Word template ไม่พบ หรือมีปัญหา: ${fetchError.message}`);
        });
    }
  }

  ngOnDestroy() {
    if (this.ref) this.ref.close();
  }
}
