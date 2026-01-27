import { BackendService } from './../service/backend.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import 'mapbox-gl-leaflet';
import { Geolocation } from '@capacitor/geolocation';
import { NavigationService } from '../service/navigation.service';
import { MapService } from '../service/map.service';
import { BackendService02 } from '../service/backend02.service';
import { CloseStops } from '../models/stop.interface';
import { AppService } from '../service/application.service';
import { Subscription } from 'rxjs';

export interface PointCoordinates {
  latitude: number;
  longtitude: number;
}
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit {

  private map!: L.Map;
  private tracker: L.Marker | undefined;
  @ViewChild('map')
  private mapContainer: ElementRef<HTMLElement> | undefined;
  private closeStops!: CloseStops[];

  private changeLanguage$!: Subscription;

  constructor(
    private navSrv: NavigationService,
    private mapSrv: MapService,
    private backSrv: BackendService,
    private backSrv02: BackendService02,
    private appSrv: AppService
  ) {}

  ngOnInit(): void {
    console.log("Tab1 page OnInit run...");
  }

  ionViewDidEnter() {
    this.navSrv.activeTitle.next(undefined);
    this.mapSrv.initMap02();
    // Ensure the map is properly resized after a short delay
    setTimeout(() => {
      if(this.map) {
        // this.map.invalidateSize();
      }
    }, 100); // Delay allows Angular rendering to complete
    this.getUserLocation();
    this.changeLanguage$ = this.appSrv.onLanguageChange.subscribe(
      (lang) => {
        if(this.closeStops) {
          this.mapSrv.addClosesest(this.closeStops);
        }
      }
    );
  }

  ionViewWillLeave() {
    if(this.changeLanguage$) {
      this.changeLanguage$.unsubscribe();
    }
  }

  private async geoLocationRequestPermission() {
    return new Promise<boolean>(async (resolve, reject) => {
      let permStatus = await Geolocation.checkPermissions();
      if (permStatus.location === 'prompt') {
        permStatus = await Geolocation.requestPermissions();
      }

      if(permStatus.location !== 'granted') {
        console.error('User denied permissions!');
        resolve(false);
      }
      resolve(true);
    });

  }

  async getUserLocation(): Promise<void> {
    // try {
    const location = await Geolocation.getCurrentPosition({
      timeout: 5000
    });
    console.log('Current position:', location);
    this.mapSrv.trackUserMap2(location.coords.latitude, location.coords.longitude);
    this.getClosestsStops(location.coords.latitude, location.coords.longitude);
  }

  getClosestsStops(lat: number, lng: number) {
    this.backSrv02.getCloseStops(lat, lng).subscribe(
      (stops) => {
        this.closeStops = stops;

      },
      (error) => {
        console.log(error);
      },
      () => {
        this.mapSrv.addClosesest(this.closeStops);
      }
    );
  }
}

