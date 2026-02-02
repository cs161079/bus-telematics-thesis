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
    const roles = this.authSrv.getRoles();
    const isOasaAdmin =roles.includes("oasa-admin"); // Example check, modify as needed
    if(isOasaAdmin) {
      return isOasaAdmin;
    } else {
      this.generalSrv.showWarningAlert(`You do not have permission to access ${state.url}.`);
      return this.router.parseUrl('/oauth/capacity');
    }
  }

}
