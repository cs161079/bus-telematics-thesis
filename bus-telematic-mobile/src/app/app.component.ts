import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NavController, Platform } from '@ionic/angular';
import { PushNotificationsService } from './service/pushnotification.service';
import { StorageService } from './service/storage.service';
import { ActivatedRoute } from '@angular/router';
import { NavigationService } from './service/navigation.service';
import { Geolocation } from '@capacitor/geolocation';
import { AppService } from './service/application.service';
import { StatusBar } from "@capacitor/status-bar"
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private _appName!: string;
  private _appVersion: any;
  @ViewChild("Sidenav") sideNav!: ElementRef;
  @ViewChild("wrapperMenu") wrapper!: ElementRef;
  private sideNavOpen: boolean = false;
  constructor(
    private platform: Platform,
    private navCtr: NavController,
    private notificationSrv: PushNotificationsService,
    private storage: StorageService,
    private _navSrv: NavigationService,
    private appSrv: AppService
  ) {}

  ngOnInit(): void {
    this.platform.ready().then(async ()=> {
      if(this.platform.is("android")) {
        StatusBar.setBackgroundColor({
          color: "#638edb"
        });
        StatusBar.show();
      }

      this.appSrv.getApplicaitonInfo().then(
        (val) => {
          this._appName = val.name;
          this._appVersion = val.version;
        }
      );
      await this.storage.initStorage();
      this.navCtr.navigateRoot("tabs");
      // Request permissions for Location and Notifications
      await this.requestLocationPermissions();
      if(this.platform.is('capacitor')) {
        await this.notificationSrv.requestNotificationPermissions();

        await this.notificationSrv.registerPushNotificationForUser();
      }




    });

  }

  getTitle(activeRoute: ActivatedRoute) {
    return activeRoute.component?.name;
  }


  openNav() {
    // console.log("Sidenav element ", this.sideNav);
    this.sideNav.nativeElement.classList.remove("close");
    this.sideNav.nativeElement.classList.add("open");
    this.wrapper.nativeElement.classList.toggle('open');
  }

  closeNav() {
    this.sideNav.nativeElement.classList.remove("open");
    this.sideNav.nativeElement.classList.add("close");
    if(this.sideNavOpen) {
      this.sideNavOpen = false;
      this.wrapper.nativeElement.classList.toggle('open');
    }
  }

  toogleNav() {
    if(this.sideNavOpen) {
      this.sideNav.nativeElement.classList.remove("open");
      this.sideNav.nativeElement.classList.add("close");
      this.sideNavOpen = false;
    } else {
      this.sideNav.nativeElement.classList.remove("close");
      this.sideNav.nativeElement.classList.add("open");
      this.sideNavOpen = true;
    }
    this.wrapper.nativeElement.classList.toggle('open');
  }

  navigate(path: string) {
    this.navCtr.navigateRoot(path);
    this.toogleNav();
  }

  get navSrv() {
    return this._navSrv;
  }

  get appName() {
    return this._appName;
  }

  get appVersion() {
    return this._appVersion;
  }

  async requestLocationPermissions() {
    if(this.platform.is("capacitor")) {
      let permStatus = await Geolocation.checkPermissions();
      if (permStatus.location === 'prompt') {
        permStatus = await Geolocation.requestPermissions();
      }

      if(permStatus.location !== 'granted') {
        console.error('User denied permissions!');
      }
    }
  }
}
