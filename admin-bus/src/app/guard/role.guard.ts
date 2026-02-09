import { ActivatedRouteSnapshot, CanActivate, GuardResult, MaybeAsync, Router, RouterStateSnapshot } from "@angular/router";
import { OAuthService } from "../service/oauth.service";
import { Injectable } from "@angular/core";
import { GeneralService } from "../service/general.service";

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authSrv: OAuthService,
    private router: Router,
    private generalSrv: GeneralService,
  ) {}
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): MaybeAsync<GuardResult> {
    const userRoles = this.authSrv.getRoles();
    const requiredRoles: string[] = route.data['roles'];
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // no role restriction
    }
    const hasRole = requiredRoles.some(role => userRoles.includes(role));

    if(hasRole) {
      return hasRole;
    } else {
      this.generalSrv.showWarningAlert(`You do not have permission to access ${state.url}.`);
      return this.router.parseUrl('/oauth/capacity');
    }
  }

}
