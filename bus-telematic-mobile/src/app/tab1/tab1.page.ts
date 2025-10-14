import { BackendService } from './../service/backend.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import 'mapbox-gl-leaflet';
import { Geolocation } from '@capacitor/geolocation';
import { NavigationService } from '../service/navigation.service';
import { MapService } from '../service/map.service';

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

  constructor(
    private navSrv: NavigationService,
    private mapSrv: MapService,
    private backSrv: BackendService
  ) {}

  ngOnInit(): void {
    console.log("Tab1 page OnInit run...");
    // Geolocation.watchPosition({
    //   enableHighAccuracy: true,
    // }, (position, err) => {
    //   this.mapSrv.trackUserLocation(position?.coords.latitude, position?.coords.longitude);
    // });
  }

  ionViewDidEnter() {
    this.navSrv.activeTitle.next("");
    this.mapSrv.initMap02();
    // Ensure the map is properly resized after a short delay
    setTimeout(() => {
      if(this.map) {
        // this.map.invalidateSize();
      }
    }, 100); // Delay allows Angular rendering to complete
    this.getUserLocation();
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
    //this.map.setView([coordinates.coords.latitude, coordinates.coords.longitude], 18);
    this.mapSrv.trackUserMap2(location.coords.latitude, location.coords.longitude);
    this.getClosestsStops(location.coords.latitude, location.coords.longitude);
    // } catch (error) {
    //   console.error('Error getting location:', error);
    //   alert('Unable to retrieve your location');
    // }
  }

  getClosestsStops(lat: number, lng: number) {
    this.backSrv.getCloseStops(lat, lng).subscribe(
      (stops) => {
        debugger;
        this.mapSrv.addClosesest(stops);
      },
      (error) => {
        console.log(error);
      }
    );
  }
}

