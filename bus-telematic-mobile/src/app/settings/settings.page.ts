import { Component } from "@angular/core";
import { NavigationService } from "../service/navigation.service";

@Component({
  selector: "app-settings-page",
  templateUrl: "./settings.page.html",
  styleUrl: "./settings.page.scss",
  standalone: false
})
export class SettingsPage {

  constructor (
    private navSrv: NavigationService
  ) {

  }

  ionViewDidEnter() {
    this.navSrv.activeTitle.next("Ρυθμίσεις");
  }

}
