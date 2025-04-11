import { HttpClient, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { initializeAppCheck, provideAppCheck, ReCaptchaV3Provider } from '@angular/fire/app-check';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgxCurrencyInputMode, provideEnvironmentNgxCurrency } from 'ngx-currency';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { DialogService } from 'primeng/dynamicdialog';

import { environment } from '../environments/environment';
import YourPreset from '../theme/styles';

import { routes } from './app.routes';
import { authTokenInterceptor } from './http_interceptors/auth-token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authTokenInterceptor]),
    ),
    provideAnimations(),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideFunctions(() => getFunctions()),
    provideStorage(() => getStorage()),
    provideHttpClient(withInterceptorsFromDi()),
    providePrimeNG({
      ripple: true,
      theme: {
        preset: YourPreset,
        options: {
          prefix: 'p-',
          darkModeSelector: '.my-dark-mode',
          cssLayer: {
            name: 'primeng',
          }
        }
      }
    }),
    provideAppCheck(() => {
      const provider = new ReCaptchaV3Provider(environment.recaptcha3SiteKey);
      return initializeAppCheck(undefined, {
        provider,
        isTokenAutoRefreshEnabled: true,
      });
    }),
    importProvidersFrom([
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    ]),
    provideEnvironmentNgxCurrency({
      align: 'right',
      allowNegative: true,
      allowZero: true,
      decimal: '.',
      precision: 2,
      prefix: '฿ ',
      suffix: ' บาท',
      thousands: ',',
      nullable: true,
      min: null,
      max: null,
      inputMode: NgxCurrencyInputMode.Financial,
    }),
    ConfirmationService,
    MessageService,
    DialogService,
  ]
};

export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
