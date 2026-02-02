import { Line, LineDetails, ScheduleMaster, ScheduleTime } from './../models/lines.interface';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AppService } from './application.service';
import { CloseStops, RouteStop } from '../models/stop.interface';
import { RouteDetails } from './map.service';
import { BusArrival, BusLocation } from '../models/oasa.interface';
import { TranslateService } from '@ngx-translate/core';

export interface ScheduleDto {
  sdc_descr: string;
  sdc_descr_eng: string;
  sdc_code: number
}

export interface Schedule {
  sdc_descr: string;
  sdc_code: number
}

export interface ScheduleTimes {
  line_code: number;
  sdc_code: number;
  start_time: string; // HH:mm:ss
  end_time: string;   // HH:mm:ss
  sort: number;
  direction: number;
}

export interface ActiveSchedule {
  sdc_code: number;
  times: ScheduleTimes[];
}

export interface SchedulesDto {
  schedules: ScheduleDto[];
  active_schedule: ActiveSchedule;
}

export interface Schedules {
  schedules: Schedule[];
  active_schedule: ActiveSchedule;
}

export interface Route {
  route_code: number;
  route_descr: string;
  route_descr_eng: string;
}

export interface Routes {
  routes: Route[];
  active_route: ActiveRoute;
}

export interface Stop {
  stop_code: number;
  stop_id: string;
  stop_descr: string;
  stop_descr_eng: string;
  senu: number;
}

export interface ActiveRoute {
  route_code: number;
  stops: Stop[];
}

export interface RouteMapDetails {
  details: RouteDetails[];
  stops: RouteStop[];
}

interface NativeAddress {
  display_name: string
  lat: string
  lon: string
}

export interface SearchAddress {
  displayName: string
  type: "myLocation" | "address"
  coords?: Point
}

export interface Point {
  lat: number
  long: number
}



@Injectable({
  providedIn: 'root'
})
export class BackendService02 {
  constructor(
    private http: HttpClient,
    private appSrv: AppService,
    private translate: TranslateService
  ) {

  }

  getLines(): Observable<Line[]> {
      return this.http.get<{data: Line[]}>(`${environment.server}/lines/list`).pipe(
        map((data) => {
          return data.data
          })
      ) as Observable<Line[]>;
  }

  getAltLineCbs(line_id: string): Observable<Line[]> {
    const url = `${environment.server}/lines/alt/list`;
    return this.http.get<{data: Line[]}>(url, {params: new HttpParams().set("line_id", line_id)}).pipe(
        map((body) => {
            return body.data;
        })
    );
  }

  // Ανάκτηση δεδομένων για την Γραμμή
  getLineDetail(line_code: number): Observable<LineDetails> {
    const url = `${environment.server}/lines/details`;
    return this.http.get<{data: LineDetails}>(url, { params: new HttpParams().set('code', line_code)}).pipe(
      map((data) => {
        return data.data;
      })
    );
  }

  getSchedules(sdc_code: number, line_code: number): Observable<Schedules> {
    const url = `${environment.server}/lines/schedules`;
    debugger;

    // ΠΡΟΣΟΧΗ το HttpParams είναι Immutable
    const queryParams = new HttpParams();
    queryParams.set("sdc_code", sdc_code);
    queryParams.set("line_code", line_code);


    return this.http.get<{data: SchedulesDto}>(url, {
        params: new HttpParams().set("sdc_code", sdc_code).set("line_code", line_code)
      }
    ).pipe(
      map((dt) => {
        const result: Schedules = {
          active_schedule: dt.data.active_schedule,
          schedules: []
        }

        dt.data.schedules.forEach(
          (dto) => {
            result.schedules.push({
              sdc_code: dto.sdc_code,
              sdc_descr: this.appSrv.language === 'el' ? dto.sdc_descr : dto.sdc_descr_eng
            })
          }
        )
        return result;
      })
    )
  }

  getScheduleDetails(sdc_code: number, line_code: number): Observable<ScheduleMaster> {
    const url = `${environment.server}/schedule/details`;
    return (this.http.get(url, {
      params: new HttpParams().set("sdc_code", sdc_code).set("line_code", line_code)
    }) as Observable<{data: ScheduleMaster}>).pipe(
      map((body) => {
        body.data.times.forEach((tm) => {
          tm.itsTime = false;
        })
        return body.data;
      })
    );
  }

  getCloseStops(lat: number, lng: number, minRadius: number, maxRadius: number): Observable<CloseStops[]> {
    const url = `${environment.server}/stop/closeStops`;
    return this.http.get<{data: CloseStops[]}>(url, {
      params: new HttpParams().set("lat", lat).set("lng", lng).set("minRadius", minRadius).set("maxRadius", maxRadius)
    }).pipe(
      map((body) => {
        return body.data;
      })
    );
  }

  getRoutes(lineCode: number): Observable<Routes> {
    const url = `${environment.server}/lines/routes`;

    return this.http.get<{data: Routes}>(url, {params: new HttpParams().set("code", lineCode)}).pipe(
      map((dt) => {
       return dt.data;
      })
    );

  }

  getRouteByCode(code: number): Observable<ActiveRoute> {
    const url = `${environment.server}/routes/stops`
    return this.http.get<{data: ActiveRoute}>(url, {params: new HttpParams().set("code", code)}).pipe(
      map((body) => {
        return body.data
      })
    );
  }

  getStopInfo(stop_code: number): Observable<Stop> {
    const url = `${environment.server}/stop/details?code=${stop_code}`;
    return this.http.get<{data: Stop}>(url, {params: new HttpParams().set("code", stop_code)}).pipe(
      map((body) => {
        return body.data;
      })
    );
  }

  getRouteDetails(routeCode: number): Observable<RouteMapDetails> {
    const url = `${environment.server}/routes/details`;
    return this.http.get<{data: RouteMapDetails}>(url, {params: new HttpParams().set("code", routeCode)}).pipe(
      map((body) => {
        return body.data;
      })
    );
  }

  getBusLocation(route_code: number): Observable<BusLocation[]> {
    const url = `${environment.server}/oasa/busLocation`;
      return this.http.get<{data: BusLocation[]}>(url, {params: new HttpParams().set("code", route_code)}).pipe(
        map((body) => {
          return body.data;
        })
      );
    }

  getBusArrivals(stop_code: number): Observable<BusArrival[]> {
    const url = `${environment.server}/oasa/arrival`
    return this.http.get<{data: BusArrival[]}>(url, {params: new HttpParams().set("code", stop_code)}).pipe(
      map((body) => {
        body.data.sort((a, b) => a.time - b.time)
        return body.data;
      })
    );
  }

  nominatimSearch(text: string): Observable<SearchAddress[]> {
    const url = `https://nominatim.openstreetmap.org/search`;
    return this.http
    .get<NativeAddress[]>(
      url, {params: new HttpParams().set("format","jsonv2")
        .set("q", text)}
    ).pipe(
      map((nativeData) => {
        let changed: SearchAddress[] = [
          {displayName: this.translate.instant("MY_LOCATION"), type: "myLocation"}
        ]
        nativeData.forEach(
          (record) => {
            changed.push({
              displayName: record.display_name,
              type: "address",
              coords: {
                lat: Number(record.lat),
                long: Number(record.lon)
              }
            })
          }
        )
        return changed
      })
    );
  }

  nomimatimReverse(lat: string, lon: string): Observable<SearchAddress[]> {
    const url = `https://nominatim.openstreetmap.org/reverse`;
    return this.http.get<NativeAddress>(
        url,
        {
          params: new HttpParams().set("format", "jsonv2")
            .set("lat", lat)
            .set("lon", lon),
        }
      ).pipe(
        map((record: NativeAddress) => {
          let changed: SearchAddress[] = [];
          changed.push({
            displayName: record.display_name,
            type: "address",
            coords: {
              lat: Number(record.lat),
              long: Number(record.lon)
            }
          });
          return changed;
        }),
      );
  }
}
