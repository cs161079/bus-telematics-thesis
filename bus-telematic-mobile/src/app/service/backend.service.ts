import { TripPlan } from './../models/trip_plan.interface';
import { Stop } from './../models/lines.interface';
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { cbRecord, Line, LineCbs, RouteDto } from "../models/lines.interface";
import { environment } from "src/environments/environment";
import { CloseStops, RouteStop } from '../models/stop.interface';
import { RouteDetails } from './map.service';
import { BusArrival, BusLocation } from '../models/oasa.interface';
import { Point } from '../navigate-page/navigate.page';
import { AppService } from './application.service';


@Injectable({
    providedIn: "root"
})
export class BackendService {
    // private domainSrv: string = "https://api.opsw.gr"
    constructor(
        private httpClnt: HttpClient,
        private appSrv: AppService
    ) {

    }

    getRouteByCode(code: number): Observable<RouteDto> {
      return (this.httpClnt.get(`${environment.server}/routes/stops?code=${code}`) as Observable<{data: RouteDto}>).pipe(
        map((body) => {
          return body.data
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
