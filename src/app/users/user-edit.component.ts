import { NgOptimizedImage } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { concatMap, of, Subscription } from 'rxjs';
import { ImageUploadService } from '../services/image-upload.service';
import { ToastService } from '../services/toast.service';
import { UserService } from '../services/user.service';
import { SharedModule } from '../shared/shared.module';

/**
 * ในชั้นนี้ จะไม่สามารถเรียกข้อมูลจาก firebase ได้
 * เพราะว่า ไม่ได้ใช้ Firebase Cloud Functions
 * ดังนั้นอย่าไปแก้ไขอะไรในนี้ <---- ****
 * */

@Component({
  selector: 'app-user-edit',
  imports: [SharedModule, NgOptimizedImage],
  template: `
    <div>
      <!--/ การเปลี่ยนภาพและรายละเอียดอื่น ทำได้แล้ว เย้ๆ -->
      <div class="flex justify-center items-center">
        <div class="profile-image">
          <img
            height="120"
            width="120"
            [ngSrc]="
              previewUrl
                ? previewUrl
                : user?.photoURL
                  ? user.photoURL
                  : 'images/dummy-user.png'
            "
            alt="photo"
          />
          <p-button
            id="in"
            icon="pi pi-pencil"
            severity="success"
            [rounded]="true"
            [raised]="true"
            (click)="inputField.click()"
          />
          <input
            #inputField
            type="file"
            hidden="hidden"
            (change)="onFileSelected($event)"
          />
        </div>
      </div>
      <div class="my-3">
        <hr class="h-px bg-gray-300 border-0"/>
      </div>
      <form [formGroup]="userForm" (ngSubmit)="saveUser()">
        <input type="hidden"/>
        <div class="field my-3">
          <label for="displayName">DisplayName</label>
          <input
            type="text"
            id="displayName"
            pInputText
            formControlName="displayName"
            name="displayName"
            class="w-full mb-2"
          />
          <div class="field my-3">
            <label for="email">Email</label>
            <input
              type="text"
              id="email"
              pInputText
              formControlName="email"
              name="email"
              class="w-full"
            />
          </div>
        </div>
        <div class="field my-3">
          <label for="password">Password</label>
          <p-password
            id="password"
            class="w-full {{ isValidPassword ? 'ng-invalid ng-dirty' : '' }}"
            [feedback]="false"
            formControlName="password"
            styleClass="p-password p-component p-inputwrapper p-input-icon-right"
            [style]="{ width: '100%' }"
            [inputStyle]="{ width: '100%' }"
            [toggleMask]="true"
          />
          @if (isValidPassword; as messages) {
            <small
              class="block p-error pl-2 font-semibold"
            >
              {{ messages }}
            </small>
          }
        </div>
        <div class="field my-3">
          <label for="role">Role</label>
          <p-autoComplete
            id="role"
            formControlName="role"
            [dropdown]="true"
            [suggestions]="filteredRoles"
            (completeMethod)="filterRoles($event)"
            optionLabel="name" optionValue="name"
            placeholder="Select roles"
            styleClass="w-full"
            appendTo="body"
          />
        </div>
        <div class="field my-3">
          <hr class="h-px bg-gray-200 border-0"/>
          <div class="flex my-4">
            <p-button
              label="Cancel"
              severity="secondary"
              styleClass="w-full"
              class="w-full mr-2"
              (onClick)="close('')"
            />
            <p-button
              label="Save"
              [disabled]="userForm.invalid"
              styleClass="w-full"
              class="w-full"
              (onClick)="saveUser()"
            />
          </div>
        </div>
      </form>
    </div>
  `,
  styles: ``
})
export class UserEditComponent implements OnDestroy {
  userForm: FormGroup;
  user: any;
  roles: any[] = [{name: 'admin'}, {name: 'manager'}, {name: 'user'}];
  filteredRoles: any[] = [];
  previewUrl: string | ArrayBuffer | null = null;
  private userUpdatedSub!: Subscription;

  constructor(
    public userService: UserService,
    private ref: DynamicDialogRef,
    private imageService: ImageUploadService,
    private config: DynamicDialogConfig,
    private message: ToastService,
  ) {
    this.userForm = new FormGroup<any>({
      uid: new FormControl(''),
      email: new FormControl('', [Validators.required, Validators.email]),
      displayName: new FormControl(''),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
      ]),
      role: new FormControl(''),
      profileImage: new FormControl(null),
    });

    if (this.config.data) {
      const data = this.config.data;
      if (data) {
        this.user = data;
        this.userForm.patchValue({...data});
      }
    }
  }

  get isValidPassword(): any {
    const control = this.userForm.get('password');
    const isInvalid = control?.invalid && control.touched;
    if (isInvalid) {
      return control.hasError('required')
        ? 'This field is required'
        : 'Enter >= 6 character & numeric';
    }
  }

  filterRoles(event: any) {
    // กรองข้อมูลตาม query ที่ผู้ใช้พิมพ์
    let filtered: any[] = [];
    let query = event.query;
    for (let i = 0; i < this.roles.length; i++) {
      let role = this.roles[i];
      if (role.name.toLowerCase().indexOf(query.toLowerCase()) == 0) {
        filtered.push(role);
      }
    }

    this.filteredRoles = filtered;
  }

  saveUser() {
    const userData = this.userForm.value;
    const roleName =
      typeof userData.role === 'object' ? userData.role.name : userData.role;

    const fakeData = {
      ...userData,
      role: roleName,
    };

    if (this.config.data) {
      // กรณีแก้ไขผู้ใช้เดิม
      this.userUpdatedSub = (
        userData.profileImage
          ? this.imageService
            .uploadImage(
              userData.profileImage,
              `images/profile/${userData.uid}`,
            )
            .pipe(
              concatMap((photoURL) =>
                this.userService.updatePhotoURL(userData.uid, photoURL),
              ),
              concatMap(() => this.userService.edit(fakeData)),
            )
          : this.userService.edit(fakeData)
      ).subscribe({
        next: () => {
          this.message.showSuccess(
            'Successfully',
            'Successfully Updated!',
          );
        },
        error: (err) => {
          this.message.showError('Error', err.message);
        },
        complete: () => this.close('edit'),
      });
    } else {
      // กรณีสร้างผู้ใช้ใหม่
      this.userService
        .create(fakeData)
        .pipe(
          concatMap((response) => {
            const uid = response.uid;
            if (userData.profileImage) {
              return this.imageService
                .uploadImage(userData.profileImage, `images/profile/${uid}`)
                .pipe(
                  concatMap((photoURL) =>
                    this.userService.updatePhotoURL(uid, photoURL),
                  ),
                );
            } else {
              return of(null);
            }
          }),
        )
        .subscribe({
          next: () => {
            this.message.showSuccess(
              'SuccessFully',
              'Successfully created!',
            );
          },
          error: (err) => {
            this.message.showError('Error', err.message);
          },
          complete: () => this.close('new'),
        });
    }
  }

  close(type: string) {
    this.ref.close(type);
  }

  ngOnDestroy() {
    if (this.userUpdatedSub) {
      this.userUpdatedSub.unsubscribe();
    }
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.userForm.patchValue({profileImage: file});
      this.userForm.get('profileImage')?.updateValueAndValidity();

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }
}
