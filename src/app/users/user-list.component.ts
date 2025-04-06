import { NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Table } from 'primeng/table';
import { UpdateUserRequest } from '../models/create-user-request.model';
import { User } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { UserService } from '../services/user.service';
import { SharedModule } from '../shared/shared.module';
import { UserEditComponent } from './user-edit.component';

@Component({
  selector: 'app-user-list',
  imports: [SharedModule, NgOptimizedImage],
  template: `
    @if (loading()) {
      <div class="loading-shade">
        <p-progressSpinner strokeWidth="4" ariaLabel="loading"/>
      </div>
    }
    @if (users) {
      <div class="table-container justify-center items-center mt-3">
        <div class="card">
          <p-table
            #dt
            [value]="users"
            [rowHover]="true"
            [scrollable]="true"
            [globalFilterFields]="['displayName', 'email', 'role']"
            [tableStyle]="{ 'min-width': '30rem' }"
            scrollHeight="750px"
            stripedRows
          >
            <ng-template #caption>
              <div class="flex justify-between items-center">
                <span>
                  <p-button
                    [disabled]="!admin"
                    icon="pi pi-plus"
                    (onClick)="addEditUser('')"
                  ></p-button>
                </span>
                <span
                  class="hidden md:block font-thasadith text-green-400 text-3xl ml-auto"
                >
                  รายชื่อผู้ใช้งาน
                </span>
                <p-iconField iconPosition="left" class="ml-auto">
                  <p-inputIcon>
                    <i class="pi pi-search"></i>
                  </p-inputIcon>
                  <input
                    pInputText
                    [formControl]="searchValue"
                    pTooltip="หารายการ หรือหมายเหตุ"
                    tooltipPosition="bottom"
                    placeholder="ค้นหา .."
                    type="text"
                    (input)="dt.filterGlobal(getValue($event), 'contains')"
                  />
                  @if (searchValue.value) {
                    <span class="icons cursor-pointer" (click)="clear(dt)">
                      <i class="pi pi-times" style="font-size: 1rem"></i>
                    </span>
                  }
                </p-iconField>
              </div>
            </ng-template>
            <ng-template #header>
              <tr>
                <th>#</th>
                <th>Photo</th>
                <th>displayName</th>
                <th>email</th>
                <th>role</th>
                <th style="min-width: 100px">Action</th>
              </tr>
            </ng-template>
            <ng-template #body let-user let-i="rowIndex">
              <tr>
                <td>{{ currentPage * rowsPerPage + i + 1 }}</td>
                <td>
                  @if (user?.photoURL) {
                    <img
                      [ngSrc]="user?.photoURL"
                      alt="photo"
                      height="80"
                      width="80"
                    />
                  } @else {
                    <img
                      [ngSrc]="'/images/dummy-user.png'"
                      alt="Profile Image"
                      height="80"
                      width="80"
                    />
                  }
                </td>
                <td>{{ user.displayName }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.role }}</td>
                <td>
                  @if (admin()) {
                    <i
                      class="pi pi-pen-to-square mr-2 ml-2 text-blue-400"
                      (click)="addEditUser(user)"
                    ></i>
                    <p-confirmPopup/>
                    <i
                      class="pi pi-trash mr-2 ml-2 text-orange-400"
                      (click)="conf($event, user)"
                    ></i>
                  } @else {
                    <i class="pi pi-lock text-100"></i>
                  }
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    }
  `,
  styles: `
    th {
      color: aquamarine;
    }
  `
})
export class UserListComponent implements OnInit {
  authService = inject(AuthService);
  confirmService = inject(ConfirmationService);
  dialogService = inject(DialogService);
  userService = inject(UserService);
  toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  ref: DynamicDialogRef | undefined;

  loading = signal(false);
  admin = signal(false);
  searchValue = new FormControl();
  users: User[] = [];

  currentPage = 0;
  rowsPerPage = 10;

  ngOnInit() {
    this.getRole();
    this.loadUser();
  }

  getValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  getRole() {
    this.authService.isAdmin().subscribe((isAdmin) => {
      this.admin.set(isAdmin);
    });
  }

  loadUser() {
    this.loading.set(true);

    this.userService.users$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: User[]) => {
          this.users = data.map((user) => {
            return {
              ...user,
              role:
                typeof user.role === 'object' && user.role !== null
                  ? (user.role as { name: string }).name
                  : user.role,
            };
          });
        },
        error: (error: any) => {
          this.loading.set(false);
          this.toastService.showError('Error', error.message);
          console.log(error.message);
        },
        complete: () => {
          setInterval(() => {
            this.loading.set(false);
          }, 100);
        },
      });
  }

  addEditUser(user: any) {
    let header = user ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้';
    this.ref = this.dialogService.open(UserEditComponent, {
      data: user,
      header: header,
      width: '360px',
      contentStyle: {overflow: 'auto'},
      breakpoints: {
        '960px': '360px',
        '640px': '360px',
        '390px': '360px',
      },
      closable: true,
    });
    this.ref.onClose.subscribe((res: string) => {
      if (!(res == 'edit' || res == 'new')) {
        return;
      }
      this.loadUser();
    });
  }

  clear(table: Table) {
    table.clear();
    this.searchValue.reset();
  }

  conf(event: Event, id: UpdateUserRequest) {
    this.confirmService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure you want to delete this user?',
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
        this.userService.delete(id).subscribe({
          next: () => {
            this.toastService.showSuccess('Success', 'User deleted successfully');
            this.setTime();
          },
          error: (error) => {
            this.toastService.showError('Error', error.message);
          },
          complete: () => {
            this.setTime();
          }
        });
      },
    });
  }

  setTime() {
    setTimeout(() => {
      this.loadUser();
    }, 100);
  }
}
