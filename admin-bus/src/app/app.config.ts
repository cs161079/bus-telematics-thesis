import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { KeycloakAngularModule, KeycloakBearerInterceptor, KeycloakService } from 'keycloak-angular';
import { DatePipe } from '@angular/common';
import { environment } from '../environments/environment';

function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: environment.keycloak,
      initOptions: {
        onLoad: 'check-sso',
        pkceMethod: 'S256',

        // 🔑 PROD SAFE
        checkLoginIframe: false,
        silentCheckSsoRedirectUri:
          window.location.origin +
          environment.keycloak.basePath +
          '/assets/silent-check-sso.html'
      },
      enableBearerInterceptor: true
    });
}

export const appConfig: ApplicationConfig = {
  providers: [
    DatePipe,
    provideRouter(routes),
    provideAnimationsAsync(),
    importProvidersFrom(KeycloakAngularModule),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService],
    },
    KeycloakService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: KeycloakBearerInterceptor,
      multi: true
    },
    provideHttpClient(withInterceptorsFromDi()),
  ]
};
