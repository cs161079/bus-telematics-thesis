import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { KeycloakService } from "keycloak-angular";
import { environment } from "../../../../environments/environment";

@Component({
  selector: "app-home",
  templateUrl: "home.page.html",
  styleUrl: "home.page.scss",
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class HomePage {
  constructor(
    private keycloak: KeycloakService
  ) {

  }

  login() {
    this.keycloak.login({
      redirectUri: environment.auth_config.redirect_url
    });
  }
}
