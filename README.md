# AccountCloneMemberTwo

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.5.

## Development server

```bash
    ng serve
```

## Repo

```aiignore
https://github.com/ruamsuk/account-clone-member-two.git
```

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

```bash 
   npm i --save-dev @types/file-saver
```
