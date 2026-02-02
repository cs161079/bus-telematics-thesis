
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
    console.log("This is route parameter: ", route);
    console.log("This is state parameter: ", state);
    keycloakService.login({
      redirectUri: window.location.origin + "/portal" + state.url
    });
  }
  return authindicated;

};
