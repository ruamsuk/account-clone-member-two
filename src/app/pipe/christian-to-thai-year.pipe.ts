import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'christianToThaiYear',
  standalone: true
})
export class ChristianToThaiYearPipe implements PipeTransform {

  transform(christianYear: number | string): number {
    const year = Number(christianYear); // แปลงให้เป็นตัวเลข
    return year + 543; // เพิ่ม 543 เพื่อแปลงเป็น พ.ศ.
  }

}
