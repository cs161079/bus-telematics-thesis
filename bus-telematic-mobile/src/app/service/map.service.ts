import { antPath } from 'leaflet-ant-path';
import { Injectable } from "@angular/core";
import { BackendService } from './backend.service';
import { BehaviorSubject, map } from 'rxjs';
import * as L from 'leaflet';
import * as gl from 'mapbox-gl-leaflet';
import { StopPage } from '../stopPage/stop.page';
import { ModalController } from '@ionic/angular';
import { BasicStopDto, CloseStops } from '../models/stop.interface';
import { BusLocation } from '../models/oasa.interface';
import { TripPart, TripPlan } from '../models/trip_plan.interface';
import { decode } from '@mapbox/polyline';
import { Geolocation } from '@capacitor/geolocation';

interface RoutePoints {
  longtitude: number;
  latitude: number;
}

export interface RouteDetails {
  routed_x: number;
  routed_y: number;
}

const DEFAULT_ZOOM = 15;
const DEFAULT_ZOOM_LOCATION = 16;

@Injectable({
  providedIn: "root"
})
export class MapService {
  private _onMap03Click: BehaviorSubject<any> = new BehaviorSubject<any>(undefined);
  private _busStationIcon!: L.Icon;
  private _busIcon!: L.Icon;
  private _bus_red!: L.Icon;
  private _bus_orange!: L.Icon;
  private _bus_yellow!: L.Icon;
  private _bus_green!: L.Icon;
  private _pointIcon!: L.Icon;
  private _myLocationIcon!: L.DivIcon;
  private _routeGroups!: any;
  private _firstMapGroup!: any;
  private _busPositionGroup!: any;
  private _pointGroups!: L.LayerGroup;
  private _map1Element!: L.Map;
  private _map2Element!: L.Map;
  private _map3Element!: L.Map;
  private _positionMarker!: L.Marker;
  private _walkLayer!: L.LayerGroup;
  private _busLayer!: L.LayerGroup;
  private _markersLayer!: L.LayerGroup;
  constructor(
    private backendSrv: BackendService,
    private modalCtrl: ModalController,
    // private renderer: Renderer2
  ) {
    this._busStationIcon = L.icon({
      iconUrl: "assets/images/map_station.png",
      iconSize: [15, 15],
      iconAnchor: [10, 10],
    });

    this._busIcon = L.icon({
      iconUrl: "assets/images/bus-map.png",
      iconSize: [40, 40],
      iconAnchor: [10, 10],
    });

    this._bus_red = L.icon({
      iconUrl: "assets/images/bus-red.png",
      iconSize: [40, 40],
      iconAnchor: [10, 10],
    });

    this._bus_orange = L.icon({
      iconUrl: "assets/images/bus-orange.png",
      iconSize: [40, 40],
      iconAnchor: [10, 10],
    });

    this._bus_yellow = L.icon({
      iconUrl: "assets/images/bus-yellow.png",
      iconSize: [40, 40],
      iconAnchor: [10, 10],
    });

    this._bus_green = L.icon({
      iconUrl: "assets/images/bus-green.png",
      iconSize: [40, 40],
      iconAnchor: [10, 10],
    });

    this._pointIcon = L.icon({
      iconUrl: "assets/icon/location-pin.png",
      iconSize: [40, 40],
      iconAnchor: [10, 10],
    })

    this._myLocationIcon = L.divIcon({
      className: 'leaflet-div-icon blue-dot-potition',
      html: '<div style="background-color: #3388ff; border-radius: 50%; width: 20px; height: 20px; border: 3px solid white;"></div>',
      iconSize: [20, 20],
      // iconAnchor: [5, 5],
    });
  }

  get onMap03Click(){
    return this._onMap03Click;
  }

  trackUserMap2(lat: any, lng: any) {
    this.trackUserLocation(this._map2Element, lat, lng);
  }

  private trackUserLocation(map: L.Map, lat: any, lng: any) {
    debugger;
    // // this._firstMapGroup?.clearLayers();
    // this._firstMapGroup?.removeLayer(this._positionMarker);
    // // Add the custom blue dot marker at the user's location
    if(this._positionMarker) {
      map.removeLayer(this._positionMarker);
    }
    this._positionMarker = L.marker([lat, lng], { icon: this._myLocationIcon }).addTo(map)
      .bindPopup('You are here!');

    map.setView([lat, lng], DEFAULT_ZOOM_LOCATION);

    // // Optionally, adjust the map's view to the user's location
    // // this.map.setView([lat, lng], 13);
  }

  addRouteGroupLayer() {


  }

  initMap03() {
    if(this._map3Element) {
      return;
    }
    this._map3Element = new L.Map('navigate-map', {
      // center: [initialState.lng, initialState.lat],
      // zoom: initialState.zoom,
      zoomControl: false
    });
    this.initMapInternal(this._map3Element);
    this._pointGroups = L.layerGroup().addTo(this._map3Element);
    this._map3Element.on('click', (e: any) => {
      // console.log("This is a event click on Map", e);
      this._onMap03Click.next(e);
    });
  }

  public initMap02() {
    // if(this._map2Element) {
    //   return;
    // }
    this._map2Element = new L.Map('tab1-map', {
      // center: [initialState.lng, initialState.lat],
      // zoom: initialState.zoom,
      zoomControl: false
    });
    this.initMapInternal(this._map2Element);
    this._firstMapGroup = L.layerGroup().addTo(this._map2Element);
  }

  public initMap01() {
    this._map1Element = new L.Map('line-map', {
      // center: [initialState.lng, initialState.lat],
      // zoom: initialState.zoom,
      zoomControl: false
    });
    this._map1Element.on('click', function (e) {
      debugger;
      console.log(e);
      e.originalEvent.stopPropagation(); // Stop event bubbling
      e.originalEvent.preventDefault(); // Prevent default scrolling
      //e.originalEvent.stopPropagation(); // Stop event bubbling
    });
    this.initMapInternal(this._map1Element);
    this._routeGroups = L.layerGroup().addTo(this._map1Element);
    this._busPositionGroup = L.layerGroup().addTo(this._map1Element);
  }

  private initMapInternal(mapElement: L.Map) {
    // Μπορεί να χρειαστεί αλλαγή. Δηλαδή νέο project στο geopApify
    // γιατί μετά από κάποιο καιρό μπορεί να μην παίζει.
    const apiKey = "f7fb570eb34742bcb94647db76911fc3";
    const mapStyle = "https://maps.geoapify.com/v1/styles/osm-carto/style.json";

    const initialState = {
      lng: 23.727620,
      lat: 37.965022,
      zoom: 15,
    };
    mapElement.setView(
      [initialState.lat, initialState.lng],
      initialState.zoom,
    );

    // the attribution is required for the Geoapify Free tariff plan
    mapElement.attributionControl
      .setPrefix("")
      .addAttribution(
        'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | © OpenStreetMap <a href="https://www.openstreetmap.org/copyright" target="_blank">contributors</a>'
      );

    L.mapboxGL({
      style: `${mapStyle}?apiKey=${apiKey}`,
      accessToken: "pk.eyJ1Ijoib3VsaXNuaWtvcyIsImEiOiJjbWNsMXVpOGQwNnNsMmpzOWYycXJybTQ0In0.LGAAzlcXoU__QIxMztOGDw"
    }).addTo(mapElement);
  }

  generateRandom() {
    return Math.floor(Math.random() * 101); // 0 to 100 inclusive
  }

  async addBusPosition(busLocations: BusLocation[]) {
    this._busPositionGroup?.clearLayers();
    try {
      const location = await Geolocation.getCurrentPosition({
        timeout: 5000
      });
      console.log("User location ", location);
      this.trackUserLocation(this._map1Element, location.coords.latitude, location.coords.longitude);
    } catch(error) {
      console.log("Error on get user location.", error);
    }
    if(busLocations) {
      busLocations.forEach(
        (busLocation) => {
          const fillPercentage = this.generateRandom()/100;
          let tmpIcon = this._bus_green;
          if(fillPercentage < 0.25) {
            tmpIcon = this._bus_green
          } else if (fillPercentage >= 0.25 && fillPercentage < 0.50) {
            tmpIcon = this._bus_yellow;
          } else if (fillPercentage >= 0.50 && fillPercentage < 0.75) {
            tmpIcon = this._bus_orange;
          } else {
            tmpIcon = this._bus_red
          }
          L.marker([busLocation.cs_lat, busLocation.cs_lng], {
            icon: tmpIcon,
            riseOnHover: true
          }).bindPopup(`<span>${busLocation.veh_code}</span>`).addTo(this._busPositionGroup);
        }
      );
    }
  }

  getPointId(p: {lat: number, long: number}) {
    return `x${p.lat.toString().replace(".", "")}y${p.long.toString().replace(".", "")}`
  }

  getPointContent(point: {lat: number, long: number}, descr: string) {
    return `<div class="stop_popup" id="${this.getPointId(point)}"><span>${descr}</span></div>`;
  }

  addNavigatePoint(point: {lat: number, long: number}, descr: string, clear: boolean) {
    const customOptions = {
        'maxWidth': 400,
        'width': 200,
        'className' : 'popupCustom'
    };
    if(clear) {
      this._pointGroups.clearLayers();
    }
    const pointMarker = L.marker([point.lat, point.long], {
      icon: this._pointIcon,
      riseOnHover: true
    }).addTo(this._pointGroups);

    pointMarker.bindPopup(this.getPointContent(point, descr), customOptions).on("popupopen", (popEvent) => {
      var popUp = popEvent.target.getPopup()
      popUp.getElement()
        .querySelector(`#${this.getPointId(point)}`)
        .addEventListener("click", (e: any) => {
          popUp.close();
          navigator.clipboard.writeText(`${point.lat}, ${point.long}`).then(async () => {
            console.log('Copied');
          });
        });
    });
    this._map3Element.setView(
      [point.lat, point.long],
      15,
    );
  }

  private addBusStationInGroup(stop: BasicStopDto, group: any) {
    // specify popup options
    const customOptions = {
        'maxWidth': 400,
        'width': 200,
        'className' : 'popupCustom'
    };
    const leafletMarker = L.marker([stop.stop_lat, stop.stop_lng], {
      icon: this._busStationIcon,
      riseOnHover: true
    }).addTo(group);

    // Στο Event popupopen assign event on popUp Component.
    const popupContent = this.getPopupContent(stop.stop_code, stop.stop_descr);
    leafletMarker.bindPopup(popupContent, customOptions).on("popupopen", (popEvent) => {
      var popUp = popEvent.target.getPopup()
      popUp.getElement()
        .querySelector(`#s${stop.stop_code}`)
        .addEventListener("click", (e: any) => {
          popUp.close();
          this.onStationClick(stop.stop_code);
        });
    });
  }

  async drawRoute(route_code: number) {
    const initliaMapOpts = {
      zoom: 14,
    };
    this._routeGroups?.clearLayers();
    const routeCoors = await this.backendSrv.getRouteDetails(route_code).pipe(
      map(
        (data) => {
          const coors: number[][] = [];
          if (data && data.details) {
            data.details.forEach((details) => {
              coors.push([details.routed_y, details.routed_x]);
            });
          }
          if(data && data.stops) {
            data.stops.forEach((stop) => {
              this.addBusStationInGroup(stop, this._routeGroups);
            });
          }
          return coors;
        }
      )
    ).toPromise();
    if(routeCoors) {
      const routeCenter = this.getCenteOfRoute(routeCoors);
      if(routeCenter) {
        this._map1Element.setView([routeCenter[0], routeCenter[1]] , initliaMapOpts.zoom);
      }
    }

    return antPath([routeCoors], {color: '#0000ff', pulseColor: "#0000ff", paused: true, weight: 5, opacity: 1}).addTo(this._routeGroups);
  }

  getPopupContent(code: number, descr: string) {
    // const result = `<span class="marker_popup_bold marker_popup">${descr}</span><span class="marker_popup">${code}</span>`
    const result = `<div class="stop_popup" id="s${code}"><b>${code}</b><br/><span>${descr}</span></div>`;
    return result;
  }

  getCenteOfRoute(arr: number[][]): number[] | undefined{
    if (arr.length === 0) return undefined; // Handle empty array

    const midIndex = Math.floor(arr.length / 2);

    return arr[midIndex];
  }

  addClosesest(stops: CloseStops[]) {
    if(stops) {
      stops.forEach((stop) => {
        this.addBusStationInGroup(stop, this._firstMapGroup);
      });
    }
  }

  async onStationClick(stop_code: number) {
    const modal = await this.modalCtrl.create({
      component: StopPage,
      componentProps: {
        stop_code: stop_code
      }
    });

    await modal.present();
  }

  clearTrip() {
    if(this._walkLayer) {
      this._walkLayer.clearLayers();
    }

    if(this._busLayer) {
      this._busLayer.clearLayers();
    }

    if(this._markersLayer) {
      this._markersLayer.clearLayers();
    }
    this._pointGroups.clearLayers();
  }

  renderPlan(plan: TripPlan) {
    debugger;
    if(!this._walkLayer) {
      this._walkLayer = L.layerGroup().addTo(this._map3Element)
    }
    if(!this._busLayer) {
      this._busLayer = L.layerGroup().addTo(this._map3Element)
    }
    if(!this._markersLayer) {
      this._markersLayer = L.layerGroup().addTo(this._map3Element)
    }
    this._walkLayer.clearLayers();
    this._busLayer.clearLayers();
    this._markersLayer.clearLayers();

    // const allBounds: L.LatLngBoundsExpression[] = [];
    const allBounds: L.LatLngTuple[] = [];

    plan.parts.forEach((part) => {
      // const coords = this.getCoordsForPart(part);
      // const coords = part.steps.map(s => [s.lat, s.lon]);
      debugger;

      const coords = decode(part.legGeometry.points);

      if (coords.length === 0) return;



      coords.forEach(([lat, lng]) => {
        allBounds.push([lat, lng] as L.LatLngTuple);
      });

      // συλλογή για fitBounds
      // coords.forEach(c => allBounds.push(L.latLngBounds(L.latLng(lat, lng))));

      if (part.mode === 'WALK') {
        // dashed/dotted polyline (οπτικά σαν κουκίδες)
        L.polyline(allBounds, {
          color: '#2c7a7b',
          weight: 8,
          dashArray: '1,10',
          lineCap: 'round'
        }).addTo(this._walkLayer);

        // προαιρετικά: μικρές κουκίδες ανά σημείο
        coords.forEach(c => {
          L.circleMarker(c as L.LatLngExpression, {
            radius: 2.5,
            weight: 0,
            fillOpacity: 1,
          }).addTo(this._walkLayer);
        });
      } else if (part.mode === 'BUS') {
        // συμπαγής γραμμή για λεωφορείο
        L.polyline(allBounds, {
          color: '#eb2525ff',
          weight: 5,
          lineCap: 'square'
        }).addTo(this._busLayer);
      }

      // προαιρετικά: markers start/end ανά part
      const start = coords[0];
      const end = coords[coords.length - 1];
      L.circleMarker(start as L.LatLngExpression, { radius: 4, color: '#10b981' })
        .bindTooltip(`${part.mode} start`)
        .addTo(this._markersLayer);
      L.circleMarker(end as L.LatLngExpression, { radius: 4, color: '#ef4444' })
        .bindTooltip(`${part.mode} end`)
        .addTo(this._markersLayer);
    });

    if (allBounds.length > 0) {
      this._map3Element.fitBounds(allBounds, { padding: [24, 24] });
    }
  }

  /**
   * Επιστρέφει πίνακα [lat, lon] για ένα part.
   * Προτεραιότητα:
   * 1) steps (αν υπάρχουν)
   * 2) legGeometry.points (αν υπάρχει σε άλλα records)
   * 3) fallback: from → to
   */
  // private getCoordsForPart(part: TripPart): [number, number][] | undefined {
  //   if (part.steps && part.steps.length > 0) {
  //     return part.steps.map(s => [s.lat, s.lon]);
  //   }
  // }

  /**
   * Polyline decoder (Google/OSM-encoded)
   * Επιστρέφει [[lat, lon], ...]
   */
  private decodePolyline(str: string, precision = 5): [number, number][] {
    let index = 0, lat = 0, lng = 0;
    const coordinates: [number, number][] = [];
    const factor = Math.pow(10, precision);

    while (index < str.length) {
      let b, shift = 0, result = 0;
      do {
        b = str.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = str.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;

      coordinates.push([lat / factor, lng / factor]);
    }
    return coordinates;
  }
}
