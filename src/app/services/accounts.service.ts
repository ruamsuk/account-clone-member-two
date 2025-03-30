import { inject, Injectable } from '@angular/core';
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
  where
} from '@angular/fire/firestore';
import { from, map, Observable } from 'rxjs';
import { Account } from '../models/account.model';

@Injectable({
  providedIn: 'root'
})
export class AccountsService {
  firestore = inject(Firestore);

  constructor() {
  }

  /**
   * 1. Load all accounts from Firestore
   * 2. Order by date in descending order
   * 3. Return an observable of the accounts
   * */
  loadAccounts() {
    const dbInstance = collection(this.firestore, 'accounts');
    const userQuery = query(dbInstance, orderBy('date', 'desc'));
    return collectionData(userQuery, {idField: 'id'}) as Observable<Account[]>;
  }

  /**
   * 1. Delete an account from Firestore
   * 2. Get the account id from the parameter
   * 3. Delete a document reference using the id
   * 4. Return an observable of the delete operation
   * */
  deleteAccount(id: string | undefined) {
    const docInstance = doc(this.firestore, 'accounts', `${id}`);
    return from(deleteDoc(docInstance));
  }

  /**
   * 1. Update an account in Firestore
   * 2. Get the account object from the parameter
   * 3. Check if the amount is a string and convert it to a number
   * 4. Create a document reference using the account id
   * 5. Update the document reference with the account object
   * 6. Return an observable of the update operation
   * */
  updateAccount(account: any) {
    if (typeof account.amount === 'string') {
      const number = account.amount.replace(/[^0-9]/g, '');
      account.amount = parseFloat(number);
    }
    const ref = doc(this.firestore, 'accounts', `${account.id}`);
    return from(updateDoc(ref, {...account, modify: new Date()}));
  }

  /**
   * 1. Add an account to Firestore
   * 2. Get the account object from the parameter
   * 3. Check if the amount is a string and convert it to a number
   * 4. Create a document reference using the account object
   * 5. Add the document reference with the account object
   * 6. Return an observable of the add operation
   * */
  addAccount(account: any) {
    if (typeof account.amount === 'string') {
      const number = account.amount.replace(/[^0-9]/g, '');
      account.amount = parseFloat(number);
    }

    const dummy = {
      date: account.date,
      details: account.details,
      amount: account.amount,
      create: new Date(),
      modify: new Date(),
      isInCome: account.isInCome ? account.isInCome : false,
      remark: account.remark,
    };
    const ref = collection(this.firestore, 'accounts');
    return from(addDoc(ref, dummy));
  }

  /**
   * 1. Search transactions by date range
   * 2. Get the start and end date from the parameter
   * 3. Get the isIncome boolean from the parameter
   * 4. Create a collection reference using the Firestore instance
   * 5. Create a query using the collection reference and the date range
   * 6. Order the query by date in ascending order
   * 7. Return an observable of the query
   * 8. Map the data to convert the amount to a number if it is a string
   * 9. Return an observable of the mapped data
   * */
  searchDateTransactions(start: Date, end: Date, isIncome: boolean) {
    const db = collection(this.firestore, 'accounts');
    const q = query(
      db,
      where('date', '>=', start),
      where('date', '<=', end),
      where('isInCome', '==', isIncome),
      orderBy('date', 'asc'),
    );
    return collectionData(q, {idField: 'id'}).pipe(
      map((data: any[]) =>
        data.map((item) => ({
          ...item,
          amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount || '0'), // ตรวจสอบและแปลง amount
        })),
      ),
    );
  }

  /**
   * 1. Search transactions by date range and description
   * 2. Get the start and end date from the parameter
   * 3. Get the description from the parameter
   * 4. Create a collection reference using the Firestore instance
   * 5. Create a query using the collection reference and the date range
   * 6. Order the query by date in descending order
   * 7. Return an observable of the query
   * 8. Map the data to convert the amount to a number if it is a string
   * 9. Return an observable of the mapped data
   * */
  searchDesc(start: Date, end: Date, description: string): Observable<any> {
    const db = collection(this.firestore, 'accounts');
    const q = query(
      db,
      where('date', '>=', start),
      where('date', '<=', end),
      where('details', '>=', description),
      where('details', '<=', description + '\uf8ff'),
      orderBy('date', 'desc'),
    );
    return collectionData(q, {idField: 'id'}).pipe(
      map((data: any[]) =>
        data.map((item) => ({
          ...item,
          amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount || '0'), // ตรวจสอบและแปลง amount
        })),
      ),
    );
  }
}
