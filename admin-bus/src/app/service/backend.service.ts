import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { CronjobRec, NotificationRec, PagingData } from "../models/models.interface";
import { environment } from "../../environments/environment";
import { map, Observable } from "rxjs";
import { KPIBucket } from "../pages/oauth/capacity/capacity.page";

@Injectable({
  providedIn: "root"
})
export class BackendService {
  constructor(
    private httpClnt: HttpClient
  ) {

  }


  pushNotification(rec: NotificationRec) {
    const url =  `${environment.server}/admin/push`
    return this.httpClnt.post(url, rec);
  }

  getJobsPaging(page: number): Observable<PagingData> {
    const url =  `${environment.server}/admin/jobs?page=${page}`
    return this.httpClnt.get(url).pipe(
      map((valueBody: any) => {
        const dataArr: CronjobRec[] = [];
        const inData : any[] = valueBody.pagingData.data;
        inData.forEach((rec) => {
          dataArr.push({
            id: rec.id,
            error: rec.errorDescr,
            status:rec.errorDescr && rec.errorDescr !== "" ? "fail" : "success",
            start: rec.runtime && rec.runtime !== "null" ? new Date(rec.runtime.replace(' ', 'T')) : undefined,
            finish: rec.finishtime && rec.finishtime !== "null" ? new Date(rec.finishtime.replace(' ', 'T')) : undefined,
          });
        });
        const returnValue: PagingData = {
          total: valueBody.pagingData.total,
          page: valueBody.pagingData.page,
          pageSize: valueBody.pagingData.pageSize,
          totalPages: valueBody.pagingData.totalPages,
          data: dataArr
        }
        return returnValue;
      }
    ));
  }

  lineSearch(text: string) {
    return this.httpClnt.get(`${environment.server}/lines/search?text=${text}`) as Observable<{data: any[]}>;
  }

  routeByLineCode(lineCode: number) {
    return this.httpClnt.get(`${environment.server}/admin/routes/${lineCode}`) as Observable<any[]>;
  }

  trafficData(route: number, date: string): Observable<{route_id: number; data: any[]; max: number}> {
    return this.httpClnt.get(`${environment.server}/admin/traffic?route=${route}&date=${date}`) as Observable<{route_id: number; max: number; data: any[]}>;
  }

  getKpis(params: {
    date: string;
    route_id: number | string;
    bucket_min?: number | string;
    lf?: number | string;
    hf?: number | string;
    mult?: number | string;
  }): Observable<KPIBucket[]> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) p = p.set(k, String(v)); });
    return this.httpClnt.get<KPIBucket[]>(`${environment.server}/admin/kpis`, { params: p });
  }

}
