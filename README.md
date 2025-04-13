# AccountCloneMemberTwo

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.5.

## Development server

```bash
    ng serve
```

## Local sources

```aiignore
G:\ACCOUNT2025\account-clone-member-two
```

## Repo.

```aiignore
https://github.com/ruamsuk/account-clone-member-two.git
```

## ข้อผิดพลาดที่พบ

1. โปรเจคเสร็จ ng serve ได้ไม่มีปัญหา
2. พอ build -c production ไม่ผ่าน error มากมายเลย
3. ค้นหาก็พบว่า IDE.ของเราฉลาดเกินไปหน่อย ไป import สิ่งที่ใช้ในฝั่ง backend เข้ามา
4. ไม่ทันสังเกตเลย build ไม่ผ่าน พอลบออกก็ผ่านฉลุย
5. ต้องดูให้ดีใน import ของแต่ละ component
6. _ที่เขียนนี้ไว้เตือนตนเองนะ_

## Functions

- เพื่อจัดการ users ในการกำหนดสิทธิให้แต่ละคน
- รวมถึงการ เพิ่ม ลบ แก้ไข ผู้ใช้แต่ละคน ด้วยอำนาจ admin & manager
- ทำเพื่อการเรียนรู้เท่านั้น เพราะเป็นโปรเจคใช้ส่วนตัว ไม่มีทีมงานอะไร
- การตั้งค่าที่สำคัญอยู่ใน functions/src/tsconfig.json & .eslintrc.js
- อย่าเผลอแอดไฟล์ functions/src/**firebase-adminsdk.json** ใน git เด็ดขาด!
- ไม่เช่นนั้นเมื่อ push code ไป git เจ้า firebase จะลบคีย์ต่างๆ ที่กำหนดไว้ทันที ทำให้ต้องไปเจนคีย์ใหม่
- ไม่เก่ง git command ก็ให้ถาม AI.จะบอกวิธีแก้ไขให้ หากเผลอไปแอดแล้ว
- มีปัญหาค่อนข้างเยอะ แต่ก็สำเร็จได้ด้วยความช่วยเหลือของ AI.
- รวมถึง JetBrains WebStorm IDE. Thank you for None-commercial use.

## วัตถุประสงค์

ต้องการปรับปรุงโค๊ดให้ดีและทันสมัยขึ้น ลดความซ้ำซ้อนของโค๊ด โดยความช่วยเหลือของ AI

1. GitHub Copilot
2. Gemini
3. Qwen
4. ChatGPT

- บางครั้งเขาก็แนะนำโค๊ดเวอร์ชั่นเดิม เช่น ถ้าถามเกี่ยวกับ TailwindCSS ซึ่งปัจจุบัน (มี.ค.2568) เป็น
  เวอร์ชั่น 4 แล้ว แต่เขามักจะแนะนำวิธีติดตั้งและตั้งค่าของเวอร์ชั่นเก่า <4
- ประการสำคัญ เผลอลบโค๊ดในเครื่องเราไป ทำให้ต้นแบบหายหมด เลยต้องทำใหม่
- ใน Monthly -> CrudMonthlyComponent
  - มีการใช้ p-treeSelect
  - มีวิธีกำหนดค่าให้กับ p-treeSelect ในค่าเริ่มต้นและการกำหนดค่าให้กับ p-treeSelect ด้วย
  - monthlyForm.patchValue({})

```typescript
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
```

- และบันทึกข้อมูล ใน Firestore

```typescript
saveMonthly()
{
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
```

- โค๊ดเก่าใน git ก็เป็นเวอร์ชั่นเก่า ต้องมาปรับปรุงใหม่ โดยเดิมใช้ PrimeFlex ซึ่งจะเลิกสนับสนุนแล้ว จึงเปลี่ยนไปใช้ TailwindCSS แทน
- หวังว่าจะใช้งานได้ตรงตามที่ต้องการ

* อันนี้เป็นคำสั่งเพื่อติดตั้ง file-saver เพื่อใช้ในการสร้างเอกสาร word document (.docx)

```bash 
   npm i --save-dev @types/file-saver
```

* แล้วอย่าลืมเพิ่มคำสั่งนี้ ใน section options ด้วย

```
options {
.......

"allowedCommonJsDependencies": [
  "docxtemplater",
  "dayjs",
  "pizzip",
  "file-saver"
  ]

.........

}
```

- ในไฟล์ angular.json เพื่อเวลา build จะได้ไม่มี warning.
