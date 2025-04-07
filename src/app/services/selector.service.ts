import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SelectorService {
  monthSearch() {
    /** month */
    return [
      {
        label: 'มกราคม',
        value: 'มกราคม',
      },
      {
        label: 'กุมภาพันธ์',
        value: 'กุมภาพันธ์',
      },
      {
        label: 'มีนาคม',
        value: 'มีนาคม',
      },
      {
        label: 'เมษายน',
        value: 'เมษายน',
      },
      {
        label: 'พฤษภาคม',
        value: 'พฤษภาคม',
      },
      {
        label: 'มิถุนายน',
        value: 'มิถุนายน',
      },
      {
        label: 'กรกฎาคม',
        value: 'กรกฎาคม',
      },
      {
        label: 'สิงหาคม',
        value: 'สิงหาคม',
      },
      {
        label: 'กันยายน',
        value: 'กันยายน',
      },
      {
        label: 'ตุลาคม',
        value: 'ตุลาคม',
      },
      {
        label: 'พฤศจิกายน',
        value: 'พฤศจิกายน',
      },
      {
        label: 'ธันวาคม',
        value: 'ธันวาคม',
      },
    ];
  }

  yearSearch() {
    let max = new Date().getFullYear() + 543;
    let min = max - 5;
    // let future = max + 5;
    // for (let i = 1; i <= future; i++) this.year.push(i);
    return [
      {
        label: min,
      },
      {
        label: min + 1,
      },
      {
        label: min + 2,
      },
      {
        label: min + 3,
      },
      {
        label: min + 4,
      },
      {
        label: min + 5,
      },
      {
        label: min + 6,
      },
      {
        label: min + 7,
      },
      {
        label: min + 8,
      },
      {
        label: min + 9,
      },
      {
        label: min + 10,
      },
    ];
  }

  /**
   * 1. yearSearch2
   * 2. สร้าง array ของปีที่มีค่าตั้งแต่ปีปัจจุบัน - 10 ปี
   * 3. ใช้ Array.from เพื่อสร้าง array ของปี
   * 4. สร้าง object ของปี ที่มี key เป็น label และ value
   * 5. label เป็น string ของปี
   * 6. value เป็น number ของปี
   * 7. คืนค่า array ของปี
   * */
  yearSearch2() {
    const currentYear = new Date().getFullYear() + 543; // แปลงเป็นพุทธศักราช
    const min = currentYear - 10;

    return Array.from({length: currentYear - min + 1}, (_, i) => {
      const year = min + i;
      return {
        label: `${year}`, // แปลงค่าเป็น string เพื่อใช้ใน label
        value: year,      // ค่า value ยังคงเป็น number
      };
    });
  }

  roleSearch() {
    return [
      {
        label: 'admin',
      },
      {
        label: 'manager',
      },
      {
        label: 'user',
      },
    ];
  }

  getRole() {
    return Promise.resolve(this.roleSearch());
  }

  getMonth() {
    return Promise.resolve(this.monthSearch());
  }

  getYear() {
    return Promise.resolve(this.yearSearch());
  }

  getYear2() {
    return Promise.resolve(this.yearSearch2());
  }
}
