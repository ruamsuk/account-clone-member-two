import { Component, OnDestroy } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import * as console from 'node:console';
import PizZip from 'pizzip';
import { SharedModule } from '../shared/shared.module';

@Component({
  selector: 'app-blood-print',
  standalone: true,
  imports: [SharedModule],
  template: `
    <p>
      blood-print works!
    </p>
  `,
  styles: ``
})
export class BloodPrintComponent implements OnDestroy {
  constructor(
    private firestore: Firestore
  ) {
  }

  generateDOCX() {
    // ดึงข้อมูลจาก Firestore

    // this.firestore.collection('bloodPressure').valueChanges().subscribe((data: any[]) => {
    //   const formattedData = data.map(record => ({
    //     date: this.formatDate(record.date),
    //     morning: {
    //       bp1: record.morning?.bp1 || '',
    //       pulse: record.morning?.pulse || ''
    //     },
    //     evening: {
    //       bp1: record.evening?.bp1 || '',
    //       pulse: record.evening?.pulse || ''
    //     }
    //   }));
    //
    //   // เรียกฟังก์ชันสร้างไฟล์ .docx
    //   this.createDocxFile(formattedData);
    // });
  }

  // formatDate(date: any): string {
  //   // แปลง Timestamp เป็นรูปแบบวันที่ภาษาอังกฤษ
  //   const options: Intl.DateTimeFormatOptions = {
  //     year: 'numeric',
  //     month: 'long',
  //     day: 'numeric'
  //   };
  //   return new Date(date.seconds * 1000).toLocaleDateString('en-US', options);
  // }

  createDocxFile(data: any[]) {
    // โหลดเทมเพลต .dotx
    fetch('/assets/template.dotx')
      .then(response => response.arrayBuffer())
      .then(content => {
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true
        });

        // แทนค่าข้อมูลลงในเทมเพลต
        doc.render({records: data});

        // สร้างไฟล์ .docx
        const out = doc.getZip().generate({
          type: 'blob',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

        // บันทึกไฟล์
        saveAs(out, 'BloodPressureReport.docx');
      })
      .catch(error => {
        console.error('Error loading template:', error);
      });
  }

  ngOnDestroy(): void {
    // if (this.ref) this.ref.close();
  }
}
