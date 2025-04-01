import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
} from '@angular/fire/firestore';
import { BloodPressure } from '../models/blood-pressure.model';
import { from, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BloodService {
  private collectionName = 'bloodPressureRecords';

  constructor(private firestore: Firestore) {}

  createBlood(bp: BloodPressure) {
    const bpCollection = collection(this.firestore, this.collectionName);
    return from(addDoc(bpCollection, bp));
  }

  updateBlood(id: string, bp: Partial<BloodPressure>): Observable<void> {
    const bpDoc = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(updateDoc(bpDoc, bp));
  }

  deleteBlood(id: string): Observable<void> {
    const bpDoc = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(deleteDoc(bpDoc));
  }

  getBloods() {
    const bpCollection = collection(this.firestore, this.collectionName);
    const bpQuery = query(bpCollection, orderBy('date', 'desc'));
    return collectionData(bpQuery, { idField: 'id' }).pipe(
      map((data) => data as BloodPressure[]),
    );
  }

  getBloodsByDateRange(
    startDate: Date,
    endDate: Date,
  ): Observable<BloodPressure[]> {
    const startTimestamp = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    );
    const endTimestamp = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
    );

    const bpCollection = collection(this.firestore, this.collectionName);
    const bpQuery = query(
      bpCollection,
      where('date', '>=', startTimestamp),
      where('date', '<=', endTimestamp),
      orderBy('date', 'desc'),
    );

    return collectionData(bpQuery, { idField: 'id' }).pipe(
      map((data) => data as BloodPressure[]),
    );
  }

  getBloodsByYearRange(
    startYear: number,
    endYear: number,
  ): Observable<BloodPressure[]> {
    const startTimestamp = new Date(startYear, 0, 1); // เริ่มต้นวันที่ 1 มกราคมของปีเริ่มต้น
    const endTimestamp = new Date(endYear, 11, 31, 23, 59, 59); // สิ้นสุดวันที่ 31 ธันวาคมของปีสิ้นสุด

    const bpCollection = collection(this.firestore, this.collectionName);
    const bpQuery = query(
      bpCollection,
      where('date', '>=', startTimestamp),
      where('date', '<=', endTimestamp),
      orderBy('date', 'desc'),
    );

    return collectionData(bpQuery, { idField: 'id' }).pipe(
      map((data) => data as BloodPressure[]),
    );
  }
}
