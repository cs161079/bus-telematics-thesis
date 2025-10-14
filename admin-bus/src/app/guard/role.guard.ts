import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { KeycloakService } from "keycloak-angular";
import { Observable, of } from "rxjs";
import { GeneralSerivce } from "../service/general.service";

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private keycloak: KeycloakService,
    private router: Router,
    private generalSrv: GeneralSerivce
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // debugger;
    const expectedRoles: string[] = route.data['roles'] || [];

    const userRoles = this.keycloak.getUserRoles(); // Assume this returns string[]
    const hasRole = expectedRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      console.warn('Access denied. Missing required role.');
      this.router.navigate(["/", "oauth"]);
      this.generalSrv.showDangerAlert("Access denied. User is Unautorized for this page.", 2000);
      return of(false); // 💥 Do NOT navigate, just block access
    }

    return of(true);
  }
}
