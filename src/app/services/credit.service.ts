import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  orderBy,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { from, map, Observable } from 'rxjs';
import { Credit, CreditData } from '../models/credit.model';
import { MonthConversionService } from './month-conversion.service';

@Injectable({
  providedIn: 'root',
})
export class CreditService {
  constructor(
    private firestore: Firestore,
    private monthConversionService: MonthConversionService,
  ) {
  }

  loadCredit() {
    const dbInstance = collection(this.firestore, 'credit');
    const q = query(dbInstance, orderBy('date', 'desc'));

    return collectionData(q, {idField: 'id'}) as Observable<Credit[]>;
  }

  getCreditSummary(month: number, year: number) {
    if (month === 1) {
      month = 12;
      year -= 1;
    } else {
      month -= 1;
    }

    const startDate = new Date(year, month, 13);
    const endDate = new Date(year, month + 1, 12);

    const creditQuery = query(
      collection(this.firestore, 'credits'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
    );

    return collectionData(creditQuery, {idField: 'id'})
      .pipe(
        map((creditData) => {
          const creditArray = creditData as CreditData[];
          const expense = creditArray
            .filter((item) => !item.isCashback)
            .reduce((sum, item) => sum + item.amount, 0);
          const cashback = creditArray
            .filter((item) => item.isCashback)
            .reduce((sum, item) => sum + item.amount, 0);

          return {expense, cashback, transactions: creditArray};
        }),
      );
  }

  createCredit(credit: any) {
    if (credit.amount === 'string') {
      const number = credit.amount.replace(/[^0-9]/g, '');
      credit.amount = parseFloat(number);
    }
    const fake = {
      date: credit.date,
      details: credit.details,
      amount: credit.amount,
      created: new Date(),
      modify: new Date(),
      isCashback: credit.isCashback ? credit.isCashback : false,
      remark: credit.remark,
    };
    const ref = collection(this.firestore, 'credit');
    return from(addDoc(ref, fake));
  }

  deleteCredit(id: string | undefined) {
    const dbInstance = doc(this.firestore, 'credit', `${id}`);
    return from(deleteDoc(dbInstance));
  }

  updateCredit(data: any) {
    if (data.amount === 'string') {
      const number = data.amount.replace(/[^0-9]/g, '');
      data.amount = parseFloat(number);
    }

    const docRef = doc(this.firestore, 'credit', `${data.id}`);
    return from(updateDoc(docRef, {...data, modify: new Date()}));
  }

  creditSearch(start: Date, end: Date) {
    const db = collection(this.firestore, 'credit');
    const q = query(
      db,
      where('date', '>=', start),
      where('date', '<=', end),
      where('isCashback', '==', false),
      orderBy('date', 'asc'),
    );
    return collectionData(q, {idField: 'id'});
  }

  creditRefund(start: Date, end: Date) {
    const col = collection(this.firestore, 'credit');
    const que = query(
      col,
      where('date', '>=', start),
      where('date', '<=', end),
      where('isCashback', '==', true),
      orderBy('date', 'asc'),
    );
    return collectionData(que, {idField: 'id'});
  }

  /** search month year & details */
  searchDesc(start: Date, end: Date, description: string) {
    const db = collection(this.firestore, 'credit');
    const q = query(
      db,
      where('date', '>=', start),
      where('date', '<=', end),
      where('details', '==', description),
      where('isCashback', '==', false),
      orderBy('date', 'desc'),
    );
    return collectionData(q, {idField: 'id'});
  }

  /** search month year and detail & cash back */
  searchDescB(start: Date, end: Date, description: string) {
    const db = collection(this.firestore, 'credit');
    const q = query(
      db,
      where('date', '>=', start),
      where('date', '<=', end),
      where('details', '==', description),
      where('isCashback', '==', true),
      orderBy('date', 'desc'),
    );
    return collectionData(q, {idField: 'id'});
  }

  searchYear(start: Date, end: Date) {
    const col = collection(this.firestore, 'credit');
    const que = query(
      col,
      where('date', '>=', start),
      where('date', '<=', end),
      where('isCashback', '==', false),
      orderBy('date', 'asc'),
    );
    return collectionData(que, {idField: 'id'});
  }
}
