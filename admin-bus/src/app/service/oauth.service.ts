import { Injectable } from "@angular/core";
import { KeycloakEvent, KeycloakEventType, KeycloakService } from "keycloak-angular";


@Injectable({
  providedIn: "root"
})
export class OAuthService {

  private _accessToken!: string;
  constructor(
    private keycloak: KeycloakService
  ) {
    // debugger;
    this.keycloak.keycloakEvents$.subscribe({
      next: (event: KeycloakEvent) => {
        switch (event.type) {
          case KeycloakEventType.OnAuthSuccess:
            console.log('✅ Auth Success');
            this.keycloak.getToken().then((accessToken: any) => {
              this._accessToken = accessToken;
            })
            break;
          case KeycloakEventType.OnAuthError:
            console.error('❌ Auth Error');
            break;
          case KeycloakEventType.OnAuthLogout:
            console.log('🔒 Logged out');
            this._accessToken = '';
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

  ngOnInit(): void {

  }

  get isLoggedIn(): boolean {
    return this.keycloak.isLoggedIn();
  }

  logout(): void {
    this.keycloak.logout('http://localhost:4200');
  }

  getToken() {
    return this._accessToken;
  }
}
