import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { NavigationService } from "../service/navigation.service";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { MapService } from "../service/map.service";
import { debounceTime, map, Subscription } from "rxjs";
import { IonicSelectableComponent } from "ionic-selectable";
import 'mapbox-gl-leaflet';
import { IonModal, LoadingController } from "@ionic/angular";
import { BackendService } from "../service/backend.service";
import { TripPlan } from "../models/trip_plan.interface";
import { Geolocation } from '@capacitor/geolocation';

export interface Point {
  lat: number;
  long: number;
}
interface SearchAddress {
  displayName: string;
  coords: Point;
}
interface NativeAddress {
  display_name: string;
  lat: string;
  lon: string;
}
@Component({
  selector: "app-navigate",
  templateUrl: "navigate.page.html",
  styleUrl: "navigate.page.scss",
})
export class NavigatePage implements OnInit, OnDestroy {

  private onMapClick$!: Subscription;
  @ViewChild("selectableComponentFrom") selectableComponentFrom!: IonicSelectableComponent;
  @ViewChild("selectableComponentTo") selectableComponentTo!: IonicSelectableComponent;
  @ViewChild("modal") modal!: IonModal;
  selectedTrip!: number;
  private searchAdressFunctionFrom$!: Subscription;
  private searchAdressFunctionTo$!: Subscription;
  private _navigationPoint1!: SearchAddress;
  private _navigationPoint2!: SearchAddress;
  private _clickCount = 0;

  private _tripPlans: TripPlan[] = [];

  numbers = [...Array(11).keys()];
  modalOpen = false;
  constructor(
    private navSrv: NavigationService,
    private http: HttpClient,
    private mapSrv: MapService,
    private bankSrv: BackendService,
    private loadCtr: LoadingController
  ) {

  }
  ngOnDestroy(): void {
    if(this.onMapClick$) {
      this.onMapClick$.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.onMapClick$ = this.mapSrv.onMap03Click.subscribe(
      (event: any) => {
        if(event) {
          this.onMapClick(event);
        }
      }
    );
  }

  async onModalClose() {
    this.modalOpen = false;
    this.selectableComponentFrom.clear();
    this.selectableComponentTo.clear();
    this.mapSrv.clearTrip();
    // await this.modal.setCurrentBreakpoint(0.15);
  }

  get navigationPoint1() {
    return this._navigationPoint1;
  }

  set navigationPoint1(value: SearchAddress) {
    this._navigationPoint1 = value;
  }

  get navigationPoint2() {
    return this._navigationPoint2;
  }

  set navigationPoint2(value: SearchAddress) {
    this._navigationPoint2 = value;
  }

  get tripPlans() {
    return this._tripPlans;
  }

  adresses: SearchAddress[] = [];

  async onMapClick(event: any) {
    if(this._navigationPoint1 && this._navigationPoint2) {
      return;
    }
    debugger;
    console.log("Map Clicked and event ", event);
    if(this._clickCount === 0) {
      this.selectableComponentFrom.clear();
      this.selectableComponentTo.clear();
      this._navigationPoint1 = await this.searchWithCoords({lat: event.latlng.lat, long: event.latlng.lng});
      this._clickCount = 1;
      this.mapSrv.addNavigatePoint({
        lat: this._navigationPoint1.coords.lat,
        long: this._navigationPoint1.coords.long
      }, "Point 1", true);
      return;
    }
    if(this._clickCount === 1) {
      this._navigationPoint2 = await this.searchWithCoords({lat: event.latlng.lat, long: event.latlng.lng});
      this._clickCount = 0;
      this.mapSrv.addNavigatePoint({
        lat: this._navigationPoint2.coords.lat,
        long: this._navigationPoint2.coords.long
      }, "Point 2", false);
      this._tripPlans = await this.searchForTrips();
      this.selectedTrip = 0;
      this.mapSrv.renderPlan(this._tripPlans[this.selectedTrip]);
      this.modalOpen = true;
      return;
    }
  }

  ionViewDidEnter() {
    // this.navSrv.activeTitle.next("Πλοήγηση");
    this.mapSrv.initMap03();

    if (this.selectableComponentFrom) {
        this.searchAdressFunctionFrom$ = this.selectableComponentFrom.onSearch.subscribe(
            (event: { component: IonicSelectableComponent; text: string }) => {
              debounceTime(3000);
              this.onSearchChange(event.text.trim());
            }
        );
    }

    if (this.selectableComponentTo) {
        this.searchAdressFunctionTo$ = this.selectableComponentTo.onSearch.subscribe(
            (event: { component: IonicSelectableComponent; text: string }) => {
                this.onSearchChange(event.text.trim());
            }
        );
    }
  }

  ionViewWillLeave() {
    if(this.searchAdressFunctionFrom$) {
      this.searchAdressFunctionFrom$.unsubscribe();
    }
    if(this.searchAdressFunctionTo$) {
      this.searchAdressFunctionTo$.unsubscribe();
    }
  }

  searchWithCoords(p: Point): Promise<SearchAddress> {
    return new Promise<SearchAddress>((resolve, reject) => {
      this.http
      .get<NativeAddress[]>(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          `${p.lat},${p.long}`
        )}`
      ).pipe(
        map((nativeData) => {
          let changed: SearchAddress[] = [];
          nativeData.forEach(
            (record) => {
              changed.push({
                displayName: record.display_name,
                coords: {
                  lat: Number(record.lat),
                  long: Number(record.lon)
                }
              });
            }
          );
          return changed;
        })
      ).subscribe(
        (results) => {
          resolve(results[0]);
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  onSearchChange(searchText: string): void {
    debounceTime(3000);
    this.http
      .get<NativeAddress[]>(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchText
        )}`
      ).pipe(
        map((nativeData) => {
          let changed: SearchAddress[] = [];
          nativeData.forEach(
            (record) => {
              changed.push({
                displayName: record.display_name,
                coords: {
                  lat: Number(record.lat),
                  long: Number(record.lon)
                }
              });
            }
          );
          return changed;
        })
      ).subscribe((results) => {
        this.adresses = results;
        this.onOpenSearch();
      });
  }

  onChangeAddress01(ev: any) {
    console.log("On Selectable Event change ", ev);
    this.mapSrv.addNavigatePoint({
      lat: ev.value.coords.lat,
      long: ev.value.coords.long
    }, "Point 1", true);
  }

  async onChangeAddress02(ev: any) {
    this.mapSrv.clearTrip();
    console.log("On Selectable Event change ", ev);
    this.mapSrv.addNavigatePoint({
      lat: ev.value.coords.lat,
      long: ev.value.coords.long
    }, "Point 2", false);

    // Call Open Trip Planner Application
    debugger;
    console.log("Request for navigation from ", this._navigationPoint1, " to ", this._navigationPoint2);
    this._tripPlans = await this.searchForTrips();
    if(this._tripPlans.length === 0) {
      console.log("Not exist avalaible trips.")
      return;
    }
    this.selectedTrip = 0;
    this.mapSrv.renderPlan(this._tripPlans[this.selectedTrip]);
    this.modalOpen = true;
  }

  searchForTrips() {
    return new Promise<TripPlan[]>(async (resolve, reject) => {
      const loadEl = await this.loadCtr.create({
        message: "Αναζητούμε τις καλύτερες διαδρομές για εσάς..."
      });
      loadEl.present();
      this.bankSrv.searchForTrips(this._navigationPoint1.coords, this._navigationPoint2.coords).subscribe(
        (result) => {
          this._tripPlans = result;
          resolve(result);
        },
        (error) => {
          console.log("Error occured on Http Request for Trip Plans ", error);
          if((error as HttpErrorResponse).status === 400) {
            reject(error.message);
          } else if((error as HttpErrorResponse).status === 500) {
            reject("Internal error.");
          }
          loadEl.dismiss();
        },
        () => {
          console.log("Request for Trip Plans complete successfully.");
          // this.selectedTrip = this._tripPlans[0];
          loadEl.dismiss();
        }
      );
    });

  }

  onInputFocus(ev: any) {

  }

  onTripClick(index: number) {
    this.selectedTrip = index;
    this.mapSrv.renderPlan(this._tripPlans[index]);
    this.modal.setCurrentBreakpoint(0.25)
  }

  async onOpenSearch() {
    const location = await Geolocation.getCurrentPosition({
      timeout: 5000
    });

    this.adresses.push({
      displayName: "Η τοποθεσία μου",
      coords: {
        lat: location.coords.latitude,
        long: location.coords.longitude
      }
    });
  }
}
