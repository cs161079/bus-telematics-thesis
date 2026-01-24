
import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { KeycloakService } from "keycloak-angular";

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
