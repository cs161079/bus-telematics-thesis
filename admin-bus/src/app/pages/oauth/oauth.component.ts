import { CommonModule } from "@angular/common";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { AlertComponent } from "../../components/alert/alert.component";
import { GeneralSerivce } from "../../service/general.service";
import { KeycloakService } from "keycloak-angular";
import * as feather from 'feather-icons';
import { ThemeService } from "../../service/theme.service";
import { environment } from "../../../environments/environment";
import { OAuthService } from "../../service/oauth.service";
import { KeycloakProfile } from "keycloak-js";

@Component({
  selector: "app-oauth",
  templateUrl: "oauth.component.html",
  styleUrl: "oauth.component.scss",
  standalone: true,
  imports: [CommonModule, RouterOutlet, AlertComponent],
})
export class OAuthComponent implements OnInit {

  @ViewChild("dropdown_menu", {static: true}) dropdownMenu!: HTMLElement;
  @ViewChild("toggleBtn", {static: true}) toggleBtn!: ElementRef;
  private _isDark: boolean = false;
  private _dropdownShow: boolean = false;
  private _profile!: KeycloakProfile;
  constructor(
    private _generalService: GeneralSerivce,
    // private keycloak: KeycloakService,
    private oauthSrv: OAuthService,
    public themeSrv: ThemeService,
  ) {

  }

  ngOnInit(): void {
    this.themeSrv.isDarkMode.subscribe(
      (isDark)=> {
        this._isDark = isDark;
        if (this.toggleBtn.nativeElement.classList.contains("active")) {
            this.toggleBtn.nativeElement.classList.remove("active");
        }

        if(!isDark) {
          this.toggleBtn.nativeElement.classList.add("active");
        }
      }
    );
    // this.oauthSrv.loadProfile.then(
    //   (data) => {
    //     this._profile = data;
    //   }
    // );
  }

  get generalService() {
    return this._generalService;
  }

  get dropdownShow() {
    return this._dropdownShow;
  }

  ngAfterViewInit() {
    feather.replace();
  }

  // isAuthindicate() {
  //   return this.keycloak.isLoggedIn();
  // }

  // logOut() {
  //   this.keycloak.logout(environment.auth_config.end_session_redirect_url);
  // }

  openDropDown() {
    // debugger;
this._dropdownShow = !this._dropdownShow;
// if(this._dropdownShow) {
//   this.dropdownMenu.classList.add("show");
// } else {
//   this.dropdownMenu.classList.remove("show");
// }
  }

  onModeChange(ev: any) {
    console.log("Checkbox changed ", ev);
    this.themeSrv.toggleTheme(ev.target.checked);
  }

  changeTheme(){
    this.themeSrv.toggleTheme(!this._isDark);
  }

  get profile() {
    return this._profile;
  }
}
