import { inject, Injectable } from '@angular/core';
import { collection, Firestore, getDocs, query, where, writeBatch } from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class DeleteDataService {
  private firestore = inject(Firestore);
  private toastService = inject(ToastService);

  async deleteByYear(collectionName: string, yearToDelete: number): Promise<void> {
    const collectionRef = collection(this.firestore, collectionName);
    let q;

    switch (collectionName) {
      case 'monthly':
        q = query(collectionRef, where('year', '==', yearToDelete));
        break;
      case 'users':
        q = query(collectionRef, where('createdAt', '>=', Timestamp.fromDate(new Date(yearToDelete, 0, 1))),
          where('createdAt', '<=', Timestamp.fromDate(new Date(yearToDelete + 1, 0, 1))));
        break;
      default:
        q = query(collectionRef, where('date', '>=', Timestamp.fromDate(new Date(yearToDelete, 0, 1))),
          where('date', '<=', Timestamp.fromDate(new Date(yearToDelete + 1, 0, 1))));
    }

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      this.toastService.showInfo('Not found', `ไม่พบข้อมูลใน Collection "${collectionName}" ของปี ${yearToDelete}`);
      return;
    }

    const batch = writeBatch(this.firestore);
    let deleteCount = 0;

    querySnapshot.forEach(doc => {
      batch.delete(doc.ref);
      deleteCount++;
    });

    await batch.commit();
    this.toastService
      .showSuccess('Deleted', `ลบข้อมูล ${deleteCount} รายการ ใน Collection "${collectionName}" ของปี ${yearToDelete} สำเร็จ`);
  }

  constructor() {
  }

  getTreeNodeData() {
    return [
      {
        key: '0',
        label: 'Collections',
        data: 'Root Database Collections',
        icon: 'pi pi-database',
        children: [
          {
            key: 'accounts',
            label: 'Account',
            data: 'accounts',
            icon: 'pi pi-wallet',
          },
          {
            key: 'bloodPressureRecords',
            label: 'Blood Pressure',
            data: 'ข้อมูลบันทึกความดันโลหิต',
            icon: 'pi pi-heart',
          },
          {
            key: 'credit',
            label: 'Credit',
            data: 'ข้อมูลเครดิต',
            icon: 'pi pi-credit-card',
          },
          {
            key: 'monthly',
            label: 'Monthly',
            data: 'ข้อมูลรายเดือน',
            icon: 'pi pi-calendar-plus',
          },
          {
            key: 'users',
            label: 'Users',
            data: 'ข้อมูลผู้ใช้งาน',
            icon: 'pi pi-user',
          },
        ],
      },
    ];
  }

  getTreeNodes() {
    return Promise.resolve(this.getTreeNodeData());
  }
}
