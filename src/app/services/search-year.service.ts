import { inject, Injectable } from '@angular/core';
import { collection, Firestore, getDocs, query, where, } from '@angular/fire/firestore';
import { forkJoin, from, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SearchYearService {
  firestore = inject(Firestore);

  loadYear(year: number): Observable<any> {
    const expensesRef = collection(this.firestore, 'credit');
    const resultsE: { [key: string]: number } = {};
    let totalCashback = 0;
    let totalExpenses = 0;

    const requests = [];

    for (let month = 0; month < 12; month++) {
      let startDate: Date;
      let endDate: Date;

      if (month === 0) {
        startDate = new Date(year - 1, 11, 13);
        endDate = new Date(year, 0, 12);
      } else {
        startDate = new Date(year, month - 1, 13);
        endDate = new Date(year, month, 12);
      }
      // console.log(
      //   `Month: ${month}, Start Date: ${startDate.toDateString()}, End Date: ${endDate.toDateString()}`,
      // );

      const q = query(
        expensesRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        where('isCashback', '==', false),
      );

      const expensesRequest = from(getDocs(q)).pipe(
        map((querySnapshot) => {
          let totalE = 0;
          querySnapshot.forEach((doc) => {
            totalE += Number(doc.data()['amount']); // แก้ปัญหา NaN
            totalExpenses += Number(doc.data()['amount']);
          });
          resultsE[this.getMonthName(month)] = totalE;
        }),
      );
      requests.push(expensesRequest);

      const cashbackQuery = query(
        expensesRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        where('isCashback', '==', true),
      );

      const cashbackRequest = from(getDocs(cashbackQuery)).pipe(
        map((cashbackSnapshot) => {
          cashbackSnapshot.forEach((doc) => {
            totalCashback += Number(doc.data()['amount']); // resolve NaN
          });
        }),
      );
      requests.push(cashbackRequest);
    }

    return forkJoin(requests).pipe(
      map(() => {
        const months = Object.keys(resultsE).map((key) => ({
          month: key,
          total: Number(resultsE[key]),
        }));

        if (months.length === 0) {
          return {
            resultsE,
            totalExpenses,
            totalCashback,
            max: 0,
            min: 0,
            avg: 0,
            maxMonth: '',
            minMonth: '',
          };
        }

        const max = Math.max(...months.map((m) => m.total));
        const min = Math.min(...months.map((m) => m.total));
        const avg = months.reduce((sum, m) => sum + m.total, 0) / months.length;

        const maxMonth = months.find((m) => m.total === max)?.month;
        const minMonth = months.find((m) => m.total === min)?.month;

        return {
          resultsE,
          totalExpenses,
          totalCashback,
          max,
          min,
          avg,
          maxMonth,
          minMonth,
        };
      }),
    );
  }

  getMonthName(monthIndex: number): string {
    const monthNames = [
      'มกราคม',
      'กุมภาพันธ์',
      'มีนาคม',
      'เมษายน',
      'พฤษภาคม',
      'มิถุนายน',
      'กรกฎาคม',
      'สิงหาคม',
      'กันยายน',
      'ตุลาคม',
      'พฤศจิกายน',
      'ธันวาคม',
    ];
    return monthNames[monthIndex];
  }
}
