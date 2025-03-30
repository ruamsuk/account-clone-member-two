import { canActivate, redirectLoggedInTo, redirectUnauthorizedTo, } from '@angular/fire/auth-guard';
import { Routes } from '@angular/router';
import { ForgotPasswordComponent } from './auth/forgot-password.component';

const redirectUnauthorizedToLogin = () =>
  redirectUnauthorizedTo(['auth/login']);
const redirectLoggedInToHome = () => redirectLoggedInTo(['/']);

export const routes: Routes = [
  {
    path: 'home',
    pathMatch: 'full',
    ...canActivate(redirectUnauthorizedToLogin),
    loadComponent: () =>
      import('./pages/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'auth',
    ...canActivate(redirectLoggedInToHome),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./auth/login.component').then((m) => {
            return m.LoginComponent;
          }),
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordComponent,
      },
    ],
  },
  {
    path: 'account',
    ...canActivate(redirectUnauthorizedToLogin),
    children: [
      {
        path: 'account-list',
        loadComponent: () =>
          import('./accounts/account-list.component').then(
            (m) => m.AccountListComponent,
          ),
      },
      {
        path: 'between',
        loadComponent: () =>
          import('./accounts/account-between.component').then(
            (m) => m.AccountBetweenComponent,
          ),
      },
      {
        path: 'between-detail',
        loadComponent: () =>
          import('./accounts/account-between-detail.component').then(
            (m) => m.AccountBetweenDetailComponent,
          ),
      },
      {
        path: 'allyear',
        loadComponent: () =>
          import('./accounts/accounts-year-calculate.component').then(
            (m) => m.AccountsYearCalculateComponent,
          ),
      },
    ],
  },
  // {
  //   path: 'credit',
  //   ...canActivate(redirectUnauthorizedToLogin),
  //   children: [
  //     {
  //       path: 'credit-list',
  //       loadComponent: () =>
  //         import('./credit/credit-list.component').then(
  //           (m) => m.CreditListComponent,
  //         ),
  //     },
  //     {
  //       path: 'between',
  //       loadComponent: () =>
  //         import('./credit/credit-between.component').then(
  //           (m) => m.CreditBetweenComponent,
  //         ),
  //     },
  //     {
  //       path: 'allyear',
  //       loadComponent: () =>
  //         import('./credit/credit-year.component').then(
  //           (m) => m.CreditYearComponent,
  //         ),
  //     },
  //   ],
  // },
  // {
  //   path: 'bloods',
  //   ...canActivate(redirectUnauthorizedToLogin),
  //   children: [
  //     {
  //       path: 'blood-list',
  //       loadComponent: () =>
  //         import('./blood/blood-list.component').then(
  //           (m) => m.BloodListComponent,
  //         ),
  //     },
  //     {
  //       path: 'blood-time-period',
  //       loadComponent: () =>
  //         import('./blood/blood-time-period.component').then(
  //           (m) => m.BloodTimePeriodComponent,
  //         ),
  //     },
  //     {
  //       path: 'blood-year-period',
  //       loadComponent: () =>
  //         import('./blood/blood-year-period.component').then(
  //           (m) => m.BloodYearPeriodComponent,
  //         ),
  //     },
  //   ],
  // },
  // {
  //   path: 'monthly',
  //   ...canActivate(redirectUnauthorizedToLogin),
  //   loadComponent: () =>
  //     import('./monthly/monthly.component').then((m) => m.MonthlyComponent),
  // },
  {
    path: 'manage-user',
    ...canActivate(redirectUnauthorizedToLogin),
    loadComponent: () =>
      import('./users/user-list.component').then(
        (m) => m.UserListComponent,
      ),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: 'home',
  },
];
