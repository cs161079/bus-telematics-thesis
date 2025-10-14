import { LineStopInfo } from './../models/lines.interface';
import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { ModalController } from "@ionic/angular";
import { BackendService } from "../service/backend.service";
import { BusArrival } from "../models/oasa.interface";
import { map, switchMap } from "rxjs";
import { Line, Stop, StopDto } from "../models/lines.interface";
import { StopService } from "../service/stop.service";

@Component({
  selector: "app-stop-page",
  templateUrl: "stop.page.html",
  styleUrl: "stop.page.scss"
})
export class StopPage implements OnInit, OnDestroy {
  @Input()
  stop_code: number = -1;

  private _arrivals: BusArrival[] = [];
  private _interval: any;
  private _stopRec!: Stop;
  private _loading: boolean = false;

  constructor(
    private bankend: BackendService,
    private modalCtrl: ModalController,
    public stopSrv: StopService
  ) {

  }
  ngOnDestroy(): void {
    clearInterval(this._interval);
  }

  ngOnInit(): void {
    this._loading = true;
    this.bankend.getStopInfo(this.stop_code).pipe(
      switchMap((val) => {
        this._stopRec = val;
        return this.bankend.getBusArrivals(this._stopRec.stop_code);
      })
    ).subscribe(
      (res) => {
        this._arrivals = res;
        const distictLines = this._arrivals.reduce((acc, curr) => {
          if (!acc.some(a => a.line_id === curr.line_id)) {
            acc.push(curr);
          }
          return acc;
        }, [] as BusArrival[]);
        this._stopRec.lines = [];
        distictLines.forEach(
          (ln) => {
            this._stopRec.lines.push({
              line_id: ln.line_id,
              line_type: ln.line_type
            });
          }
        )
      },
      (error) => {
        this.stopLoading();
      },
      () => {
        this.stopLoading();
        this.fixLoaders();
      }
    );

    this._interval = setInterval(() => {
      console.log("🚀~ Interval for get Bus Arrival run...");
      this.fetchData(false);
    }, 60000);

    this._interval = setInterval(() => {
      this.fixLoaders();
    }, 10000);
  }

  private stopLoading() {
    this._loading = false;
    // setTimeout(() => {
    //   this._loading = false;
    // }, 1000);
  }

  ionViewDidEnter() {
  }

  fetchData(withloading?: boolean, ev?: any) {
    if(withloading) {
      this._loading = true;
    }

    this.bankend.getBusArrivals(this.stopCode).pipe(
      map((vals) => {
        vals.sort((a, b) => a.time - b.time)
        return vals;
      })).subscribe(
      (finalVals) => {
        this._arrivals = finalVals;
      },
      (err) => {
        console.log("Error on Request ", err);
        this.stopLoading();
      },
      () => {
        if(ev) {
          ev.target.complete();
        }
        this.stopLoading();
      }
    );
  }

  onBackdrop(ev: any) {
    this.modalCtrl.dismiss();
  }

  onRefreshClick(ev: any) {
    this.fetchData(undefined, ev);
  }

  get loading() {
    return this._loading;
  }

  get stopDescr() {
    return this._stopRec ? this._stopRec.stop_descr : "";
  }

  get stopCode() {
    return this._stopRec ? this._stopRec.stop_code : -1;
  }

  get stopId() {
    return this._stopRec.stop_id;
  }

  get arrivals() {
    return this._arrivals;
  }

  getLineRec(inRec: BusArrival): Line {
    return {
      line_code: inRec.line_code,
      line_descr: inRec.route_descr,
      line_id: inRec.line_id,
      line_type: inRec.line_type
    };
  }

  getColor(passenger: number, cap: number) {
    const percentage = passenger/cap;
    if(percentage <= 0.25) {
      return 'green';
    } else if (percentage <= 0.5) {
      return 'yellow';
    } else if(percentage <= 0.75) {
      return 'orange';
    } else {
      return 'red';
    }
  }

  addRemoveFavStop() {
      this.stopSrv.addOrRemoveStopToFavorite(this._stopRec);
    }

  getPercentage(passenger: number, cap: number) {
    const percentage = passenger/cap * 100;
    return percentage + "%";
  }

  generateRandom() {
    return Math.floor(Math.random() * 101); // 0 to 100 inclusive
  }

  fixLoaders() {
    this._arrivals.forEach(
      (arrival) => {
        if(arrival.time !== 999) {
          arrival.passenger = this.generateRandom(),
          arrival.capacity = 100;
        }
      }
    );
  }

  get stop() {
    return this._stopRec;
  }
}
