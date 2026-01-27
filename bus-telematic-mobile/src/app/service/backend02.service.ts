import { Line, LineDetails, ScheduleMaster, ScheduleTime } from './../models/lines.interface';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { AppService } from './application.service';
import { CloseStops } from '../models/stop.interface';

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



@Injectable({
  providedIn: 'root'
})
export class BackendService02 {
  constructor(
    private http: HttpClient,
    private appSrv: AppService
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

  getCloseStops(lat: number, lng: number): Observable<CloseStops[]> {
    const url = `${environment.server}/stop/closeStops`;
    return this.http.get<{data: CloseStops[]}>(url, {params: new HttpParams().set("lat", lat).set("lng", lng)}).pipe(
      map((body) => {
        return body.data;
      })
    );
  }
}
