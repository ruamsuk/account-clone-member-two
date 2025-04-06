import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MonthConversionService {
  private thaiMonths: { [key: string]: number } = {
    มกราคม: 1,
    กุมภาพันธ์: 2,
    มีนาคม: 3,
    เมษายน: 4,
    พฤษภาคม: 5,
    มิถุนายน: 6,
    กรกฎาคม: 7,
    สิงหาคม: 8,
    กันยายน: 9,
    ตุลาคม: 10,
    พฤศจิกายน: 11,
    ธันวาคม: 12,
  };

  thaiMonthToNumber(monthName: string): number | undefined {
    return this.thaiMonths[monthName];
  }
}
