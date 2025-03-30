import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  query,
  updateDoc,
} from '@angular/fire/firestore';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Monthly } from '../models/monthly.model';

@Injectable({
  providedIn: 'root',
})
export class MonthlyService {
  constructor(private firestore: Firestore) {
  }

  // loadMonthly(): Observable<Monthly[]> {
  //   const db = collection(this.firestore, 'monthly');
  //   const q = query(db, orderBy('datestart', 'desc'));
  //   return collectionData(q, {idField: 'id'});
  // }

  getSortedMonthlyData() {
    const collectionRef = collection(this.firestore, 'monthly');
    const queryRef = query(collectionRef);

    return collectionData(queryRef, {idField: 'id'}).pipe(
      map((data: any[]) => {
          return data.sort((a: Monthly, b: Monthly) => {
            const yearA = Number(a.year);
            const yearB = Number(b.year);
            const monthA = this.thaiMonthToNumber(a.month);
            const monthB = this.thaiMonthToNumber(b.month);

            return yearB - yearA || monthB - monthA;
          });
        }
      )
    );

  }

  addMonthly(monthly: any) {
    const fake: Monthly = {
      year: monthly.year,
      datestart: new Date(monthly.datestart),
      dateend: new Date(monthly.dateend),
      month: monthly.month.label,
    };
    const ref = collection(this.firestore, 'monthly');
    return from(addDoc(ref, fake));
  }

  updateMonthly(monthly: any) {
    /**
     * ค่า month ที่ส่งมาเป็น array {'label': 'ชื่อเดือน', ...}
     *  ต้องแปลงเอาแต่ชื่อเดือนเท่านั้น
     * */
    const data = {
      id: monthly.id,
      year: monthly.year,
      month: monthly.month.label,
      datestart: monthly.datestart,
      dateend: monthly.dateend,
    };
    const db = doc(this.firestore, 'monthly', `${monthly.id}`);
    return from(updateDoc(db, data));
  }

  deleteMonth(id: string | undefined) {
    const docInstance = doc(this.firestore, 'monthly', `${id}`);
    return from(deleteDoc(docInstance));
  }

  thaiMonthToNumber(month: string): number {
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม',
      'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม',
      'พฤศจิกายน', 'ธันวาคม',
    ];
    const index = thaiMonths.indexOf(month);
    return index !== -1 ? index + 1 : 0;
  }

}
