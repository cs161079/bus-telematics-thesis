import { TripPlan } from './../models/trip_plan.interface';
import { Stop } from './../models/lines.interface';
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { cbRecord, Line, LineCbs, RouteDto } from "../models/lines.interface";
import { environment } from "src/environments/environment";
import { RouteDetails } from './map.service';
import { BusArrival, BusLocation } from '../models/oasa.interface';
import { AppService } from './application.service';
import { Point } from './backend02.service';


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

    getBusLocation(route_code: number): Observable<BusLocation[]> {
      return (this.httpClnt.get(`${environment.server}/oasa/busLocation?code=${route_code}`) as Observable<{data: BusLocation[];}>).pipe(
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
