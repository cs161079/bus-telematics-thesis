import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { GeneralSerivce } from "../../service/general.service";
import { KeycloakService } from "keycloak-angular";

@Component({
  selector: "app-unoauth",
  templateUrl: "unoauth.component.html",
  styleUrl: "unoauth.component.scss",
  standalone: true,
  imports: [RouterOutlet],
})
export class UnOAuthComponent {
  constructor(
  ) {

  }
}
