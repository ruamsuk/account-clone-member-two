import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { map, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { EventService } from './event.service';

/**
 * 1. สร้าง service ชื่อ MenuItemsService
 * 2. สร้าง method ชื่อ items() ที่ return ค่าเป็น array ของ object ที่มี properties ดังนี้
 *   - label: ชื่อเมนู
 *   - route: ชื่อ route ที่จะ navigate ไป
 *   - icon: ชื่อ icon ที่จะใช้แสดง
 *   - items: array ของ object ที่มี properties ดังนี้
 *   - label: ชื่อเมนูย่อย
 *   - icon: ชื่อ icon ที่จะใช้แสดง
 *   - command: function ที่จะทำงานเมื่อ click เมนูย่อย
 *   - visible: boolean ที่บอกว่าเมนูนี้จะแสดงหรือไม่
 *   - ให้เรียก method นี้จากหน้า app.component.ts หรือ header.component และส่งผลลัพธ์ไปแสดงในเมนู
 * 3. ใช้ inject ในการ inject AuthService, EventService และ Router
 * 4. สร้าง method ชื่อ popupItems() ที่ return ค่าเป็น array ของ object ที่มี properties ดังนี้
 *  - label: ชื่อเมนู
 *  - icon: ชื่อ icon ที่จะใช้แสดง
 *  - command: function ที่จะทำงานเมื่อ click เมนู
 *  - ให้เรียก method นี้จากหน้า app.component.ts หรือ header.component และส่งผลลัพธ์ไปแสดงในเมนู popup
 * 5. ใช้ EventService เพื่อเปิด dialog ของ user profile เมื่อ click เมนู popup
 * 6. ใช้ AuthService เพื่อ logout เมื่อ click เมนู logout
 * 7. ใช้ authService.isAdmin() เพื่อตรวจสอบว่า user ที่ login เป็น admin or manager หรือไม่
 * 8. เพื่อให้เมนูแสดงตามสิทธิ์ของ user ให้เพิ่ม property visible ใน object ของเมนู
 * */

@Injectable({
  providedIn: 'root'
})
export class MenuItemsService {
  private authService: AuthService = inject(AuthService);
  private eventService: EventService = inject(EventService);
  private router: Router = inject(Router);

  getMenuItems(): Observable<MenuItem[]> {
    return this.authService.isAdmin().pipe(
      map((isAdmin) => [
        {
          label: 'Home',
          icon: 'pi pi-home',
          command: () => this.router.navigateByUrl('/home').then(),
        },
        {
          label: 'Accounts',
          icon: 'pi pi-database',
          items: [
            {
              label: 'รายการบัญชี',
              icon: 'pi pi-list',
              command: () => this.router.navigateByUrl('/account/account-list').then()
            },
            {
              label: 'ตามช่วงเวลา',
              icon: 'pi pi-calendar-clock',
              command: () => this.router.navigateByUrl('/account/between').then()
            },
            {
              label: 'ช่วงเวลาและรายการ',
              icon: 'pi pi-calendar-plus',
              command: () => this.router.navigateByUrl('/account/between-detail').then()
            },
            {
              label: 'ตลอดทั้งปี',
              icon: 'pi pi-book',
              command: () => this.router.navigateByUrl('/account/allyear').then()
            },
          ],
        },
        {
          label: 'Credits',
          icon: 'pi pi-credit-card',
          items: [
            {
              label: 'รายการเครดิต',
              icon: 'pi pi-list',
              command: () => this.router.navigateByUrl('/credit/credit-list').then()
            },
            {
              label: 'ตามช่วงเวลา',
              icon: 'pi pi-clock',
              command: () => this.router.navigateByUrl('/credit/between').then()
            },
            {
              label: 'ตลอดปี',
              icon: 'pi pi-book',
              command: () => this.router.navigateByUrl('/credit/allyear').then()
            },
          ],
        },
        {
          label: 'Blood pressure',
          icon: 'pi pi-heart',
          items: [
            {
              label: 'Blood List',
              icon: 'pi pi-list',
              command: () => this.router.navigateByUrl('/bloods/blood-list').then()
            },
            {
              label: 'Time period',
              icon: 'pi pi-calendar-clock',
              command: () => this.router.navigateByUrl('/bloods/blood-time-period').then()
            },
            {
              label: 'Year period',
              icon: 'pi pi-calendar-plus',
              command: () => this.router.navigateByUrl('/bloods/blood-year-period').then()
            },
          ],
        },
        {
          label: 'Monthly',
          icon: 'pi pi-calendar',
          items: [
            {
              label: 'แสดงวันที่กำหนด',
              icon: 'pi pi-book',
              command: () => this.router.navigateByUrl('/monthly').then()
            },
          ],
        },
        {
          label: 'AdminZone',
          icon: 'pi pi-users',
          visible: isAdmin, // ถูกต้อง ใช้ isAdmin Observable ในนี้แล้วได้ค่าที่ถูกจริงๆ
          items: [
            {
              label: 'Users list',
              icon: PrimeIcons.USERS,
              command: () => this.router.navigateByUrl('/manage-user').then()
            },
            {
              label: 'Delete data',
              icon: PrimeIcons.TRASH,
              command: () => this.router.navigateByUrl('/delete-data').then()
            },
          ],
        },
        {
          label: 'Logout',
          icon: 'pi pi-sign-out',
          command: () => {
            this.authService.logout().then(() => this.router.navigateByUrl('/auth/login').then());
          },
        },
      ])
    );
  }

  getPopupItems(): MenuItem[] {
    return [
      {
        label: 'Profile',
        icon: 'pi pi-user',
        command: () => {
          this.eventService.openUserDialog();
        },
      },
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: () => {
          this.authService.logout().then(() => {
            this.router.navigateByUrl('/auth/login').then();
          });
        },
      },
    ];
  }
}
