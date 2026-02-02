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

  minRadius: number = 0;
  maxRadius: number = 0;
  // private map!: L.Map;
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
    setTimeout(() => {
      this.mapSrv.initMap02();
      this.mapSrv.map2Element.on('zoomend', async() => {
        const location = await this.getLocation();
        this.getClosestsStops(location.coords.latitude, location.coords.longitude);
      });
      this.getUserLocation();
    }, 200);

    // Ensure the map is properly resized after a short delay
    // setTimeout(() => {
    //   if(this.map) {
    //     // this.map.invalidateSize();
    //   }
    // }, 100); // Delay allows Angular rendering to complete

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

  // private async geoLocationRequestPermission() {
  //   return new Promise<boolean>(async (resolve, reject) => {
  //     let permStatus = await Geolocation.checkPermissions();
  //     if (permStatus.location === 'prompt') {
  //       permStatus = await Geolocation.requestPermissions();
  //     }

  //     if(permStatus.location !== 'granted') {
  //       console.error('User denied permissions!');
  //       resolve(false);
  //     }
  //     resolve(true);
  //   });

  // }

  async getLocation() {
    return await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,      // ⬅️ 15s (όχι 5s)
        maximumAge: 30000
      });
  }

  async getUserLocation(): Promise<void> {
    // try {
    const location = await this.getLocation();
    console.log('Current position:', location);
    this.mapSrv.trackUserMap2(location.coords.latitude, location.coords.longitude);
    this.getClosestsStops(location.coords.latitude, location.coords.longitude);
  }

  getClosestsStops(lat: number, lng: number) {
    debugger;
    const bounds = this.mapSrv.map2Element.getBounds();
    const center = bounds.getCenter();
    const north = bounds.getNorth();
    const toRadiusKm =  Number((center.distanceTo([north, center.lng])/1000).toFixed(2));
    if(toRadiusKm < this.maxRadius) {
      return;
    }
    this.minRadius = this.maxRadius;
    this.maxRadius = toRadiusKm;
    if(toRadiusKm > 3.5) {
      return;
    }
    this.backSrv02.getCloseStops(lat, lng, this.minRadius, this.maxRadius).subscribe(
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

