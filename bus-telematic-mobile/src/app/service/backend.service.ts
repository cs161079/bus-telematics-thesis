import { TripPlan } from './../models/trip_plan.interface';
import { ScheduleMaster, Stop } from './../models/lines.interface';
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { cbRecord, Line, LineCbs, LineDto, RouteDto } from "../models/lines.interface";
import { environment } from "src/environments/environment";
import { CloseStops, RouteStop } from '../models/stop.interface';
import { RouteDetails } from './map.service';
import { BusArrival, BusLocation } from '../models/oasa.interface';
import { Point } from '../navigate-page/navigate.page';


@Injectable({
    providedIn: "root"
})
export class BackendService {
    // private domainSrv: string = "https://api.opsw.gr"
    constructor(
        private httpClnt: HttpClient,
    ) {

    }

    getLines(): Observable<{lines: Line[]}> {
        return this.httpClnt.get(`${environment.server}/lines/list`) as Observable<{lines: Line[]}>
    }

    getLineByCode(code: number): Observable<LineDto> {
        return (this.httpClnt.get(`${environment.server}/lines/details?code=${code}`) as Observable<{data: LineDto}>).pipe(
            map((body) => {
                body.data.schedule.times.forEach((tm) => {
                  tm.itsTime = false;
                })
                return body.data;
            })
        );
    }

    getRouteByCode(code: number): Observable<RouteDto> {
      return (this.httpClnt.get(`${environment.server}/routes/stops?code=${code}`) as Observable<{data: RouteDto}>).pipe(
        map((body) => {
          return body.data
        })
      );
    }

    getScheduleDetails(sdc_code: number, line_code: number): Observable<ScheduleMaster> {
      return (this.httpClnt.get(`${environment.server}/schedule/details?sdc_code=${sdc_code}&line_code=${line_code}`) as Observable<{data: ScheduleMaster}>).pipe(
        map((body) => {
          body.data.times.forEach((tm) => {
            tm.itsTime = false;
          })
          return body.data;
        })
      );
    }

    getLineCbs(code: number): Observable<LineCbs> {
        return (this.httpClnt.get(`${environment.server}/lines/cbs?code=${code}`) as Observable<{data: LineCbs}>).pipe(
            map((body) => {
                return body.data;
            })
        );
    }

    getAltLineCbs(line_id: string): Observable<cbRecord[]> {
        return (this.httpClnt.get(`${environment.server}/lines/alt/list?line_id=${line_id}`) as Observable<{data: {altLines: cbRecord[]}}>).pipe(
            map((body) => {
                return body.data.altLines;
            })
        );
    }

    lineSearch(text: string): Observable<Line[]> {
      return (this.httpClnt.get(`${environment.server}/lines/search?text=${text}`) as Observable<{data: Line[]}>).pipe(
        map((body) => {
          return body.data;
        })
      );
    }

    getStopInfo(stop_code: number): Observable<Stop> {
      return (this.httpClnt.get(`${environment.server}/stop/info?code=${stop_code}`) as Observable<{data: Stop}>).pipe(
        map((body) => {
          return body.data;
        })
      );
    }

    getBusArrivals(stop_code: number): Observable<BusArrival[]> {
      return (this.httpClnt.get(`${environment.server}/oasa/arrival?code=${stop_code}`) as Observable<{data: BusArrival[];}>).pipe(
        map((body) => {
          body.data.sort((a, b) => a.time - b.time)
          return body.data;
        })
      );
    }

    getBusLocation(route_code: number): Observable<BusLocation[]> {
      return (this.httpClnt.get(`${environment.server}/oasa/busLocation?code=${route_code}`) as Observable<{data: BusLocation[];}>).pipe(
        map((body) => {
          return body.data;
        })
      );
    }

    getRouteDetails(routeCode: number): Observable<{details: RouteDetails[]; stops: RouteStop[];}> {
      return (this.httpClnt.get(`${environment.server}/routes/details?code=${routeCode}`) as Observable<{data: {details: RouteDetails[]; stops: RouteStop[]}}>).pipe(
        map((body) => {
          return body.data;
        })
      );
    }

    getCloseStops(lat: number, lng: number): Observable<CloseStops[]> {
      return (this.httpClnt.get(`${environment.server}/stop/closeStops?lat=${lat}&lng=${lng}`) as Observable<{stops: CloseStops[]}>).pipe(
        map((body) => {
          return body.stops;
        })
      );
    }

    searchForTrips(from: Point, to: Point) {
      return (this.httpClnt.post(`${environment.server}/otp/plan`, {
        from: {
          lat: from.lat,
          lng: from.long
        },to: {
          lat: to.lat,
          lng: to.long
        }
      }
      ) as Observable<{data: TripPlan[]}>).pipe(
        map((body) => {
          return body.data
        })
      ) as Observable<TripPlan[]>;
    }
}
