import { APP_INITIALIZER, Component, importProvidersFrom } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GeneralSerivce } from './service/general.service';
import { AlertComponent } from './components/alert/alert.component';
import { CommonModule } from '@angular/common';
import { KeycloakEvent, KeycloakEventType, KeycloakService } from 'keycloak-angular';
import * as feather from 'feather-icons';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AlertComponent],
  providers: [
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Notification Panel';

  constructor(
    private _generalServ: GeneralSerivce,
    private keycloak: KeycloakService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.keycloak.keycloakEvents$.subscribe({
      next: (event: KeycloakEvent) => {
        switch (event.type) {
          case KeycloakEventType.OnAuthSuccess:
            console.log('✅ Auth Success');
            break;
          case KeycloakEventType.OnAuthError:
            console.error('❌ Auth Error');
            break;
          case KeycloakEventType.OnAuthLogout:
            console.log('🔒 Logged out');
            // this._accessToken = '';
            break;
          case KeycloakEventType.OnTokenExpired:
            console.warn('⚠️ Token Expired');
            // Optional: trigger silent refresh
            this.keycloak.updateToken(60);
            break;
          default:
            console.log('Keycloak Event:', event.type);
        }
      },
    });
  }

  ngAfterViewInit() {
    feather.replace();
  }

  get generalService() {
    return this._generalServ;
  }

}
