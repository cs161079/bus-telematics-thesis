import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { KeycloakService } from "keycloak-angular";
import { Observable, of } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {

  constructor(
    private keycloak: KeycloakService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    if (this.keycloak.isLoggedIn()) {
      // Redirect if already logged in
      this.router.navigate(['/oauth']);
      return of(false);
    }

    return of(true); // Allow access to login page
  }
}
