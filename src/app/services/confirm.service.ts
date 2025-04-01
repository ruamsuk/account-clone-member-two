import { Injectable } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { Observable } from 'rxjs';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {

  constructor(
    private confirmService: ConfirmationService,
    private toastService: ToastService
  ) {
  }

  /**
   * 1. ลบข้อมูลตามที่ส่ง service และ id ที่ต้องการลบมา
   * */
  confirm(
    event: Event,
    id: string,
    deleteService: any,
    deleteMethode: (id: string) => Observable<any>,
    successCallback: () => void,
    errorCallback: (error: any) => void,
  ) {
    this.confirmService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to delete this record?`,
      icon: 'pi pi-info-circle',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outline: true,
      },
      acceptButtonProps: {
        label: 'Delete',
        severity: 'danger',
      },
      accept: () => {
        deleteMethode.call(deleteService, id).subscribe({
          next: () => {
            this.toastService.showSuccess('Delete', 'Delete Successfully');
            successCallback();
          },
          error: (err: any) => {
            this.toastService.showError('Error', err.message);
            errorCallback(err);
          },
        });
      },
      reject: () => this.toastService.showInfo('Information', 'You have rejected'),
    });
  }
}
