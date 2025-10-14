
import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { KeycloakService } from "keycloak-angular";
import { GeneralSerivce } from "../service/general.service";

export const AuthGuard: CanActivateFn = (route, state) => {
  const keycloakService = inject(KeycloakService);
  const router = inject(Router);
  const authindicated = keycloakService.isLoggedIn();
  if(authindicated) {
    console.log("✅ User is Authindicated!");
  } else {
    console.warn("❌ User is not Authindicated!");
    router.navigate(["/", "unoauth", "home"]);
  }
  return authindicated;

};


// export const RoleGuard: CanActivateFn = (route, state) => {
//   const keycloakService = inject(KeycloakService);
//   const generalSrv = inject(GeneralSerivce);
//   const router = inject(Router);
//   const requiredRole = keycloakService.getUserRoles().find(x => x === "oasaAdmin");
//   if(requiredRole) {
//     console.log("✅ User is Authindicated!");
//   } else {
//     console.warn("❌ User is Unauthorized!");
//     generalSrv.showDangerAlert("User is Unauthorized for this page!");
//   }

//   return requiredRole !== undefined;
// };
