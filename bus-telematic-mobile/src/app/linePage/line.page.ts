import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { BackendService } from "../service/backend.service";
import { firstValueFrom } from "rxjs";
import { cbRecord, Direction, Line, LINE_TYPE, LineDetails } from "../models/lines.interface";
import { ActionSheetButton, ActionSheetController, ModalController } from "@ionic/angular";
import { DatePipe } from "@angular/common";
import { LineService } from "../service/line.service";
import { StorageService } from "../service/storage.service";
import { StopPage } from "../stopPage/stop.page";
import * as L from "leaflet";
import { MapService } from "../service/map.service";
import { ActiveSchedule, BackendService02, Schedule, ScheduleTimes } from "../service/backend02.service";
import { HttpErrorResponse } from "@angular/common/http";
import { AppService } from "../service/application.service";
import { TranslateService } from "@ngx-translate/core";

@Component({
    selector: "app-line-page",
    templateUrl: "line.page.html",
    styleUrls: ["line.page.scss"],
    providers: [DatePipe], // Provide the DatePipe in the component
    standalone: false
})
export class LinePage implements OnInit, OnDestroy{
  private map!: L.Map;
  private _busLocatInterval: any;
  private _scheduleInterval: any;

  selectedSchedule!: ActiveSchedule
  selectedSched!: number;
  line!: LineDetails;
  lineSchedules!: Schedule[];

  @Input()
  line_code: number = -1;

  routes: cbRecord[] = [];
  altLines: Line[] = [];

  selectedRoute!: number;

  drawRoute!: any;

  constructor(
      private backendSrv: BackendService,
      private actionCtrl: ActionSheetController,
      private modalCtrl: ModalController,
      private datePipe: DatePipe,
      public lineSrv: LineService,
      private storageSrv: StorageService,
      private mapSrv: MapService,
      private back02: BackendService02,
      private appSrv: AppService,
      private translate: TranslateService
  ) {

  }
  ngOnDestroy(): void {
    clearInterval(this._scheduleInterval);
    clearInterval(this._busLocatInterval);
  }

  ngOnInit(): void {
    console.log("OnInit method...")
  }

  ionViewDidEnter() {
    this.mapSrv.initMap01();
  }

  // getLineInfor

  private loadFullLine(line_code: number) {
    this.line_code = line_code;
    this.getLineInfo().then(
        (data) => {
          this.line = data;
          this.getSchedules();
          this.getAltLines();
        }
      );
  }

  private async getLineInfo() {
    return await firstValueFrom(this.back02.getLineDetail(this.line_code));
  }

  private getSchedules() {
    this.back02.getSchedules(this.line.sdc_code, this.line.line_code).subscribe(
      (data) => {
        this.selectedSchedule = data.active_schedule;
        this.lineSchedules = data.schedules;
        this.selectedSched = data.active_schedule.sdc_code;
      }
    )
  }

  ionViewWillEnter() {
    this.loadFullLine(this.line_code);
  }

  getAltLines() {
    this.back02.getAltLineCbs(this.line.line_id).subscribe(
      (data) => {
        this.altLines = data;
      },
      (error: HttpErrorResponse) => {
        console.log("On Alternative lines Request ", error);
      }
    );
  }

    private getActionBtns(dataArr: cbRecord[], selectedVal?: any): ActionSheetButton[] {
        let result: ActionSheetButton[] = [];
        dataArr.forEach((rec) => {
            result.push({
                text: rec.descr,
                data: rec.code,
                icon: rec.code === selectedVal ? 'checkmark-outline' : undefined,
                cssClass: rec.code === selectedVal ? 'selected-val-action-sheet' : undefined,
                handler() {
                    console.log(`Recod with code ${rec.code} and Description ${rec.descr} is selected.`);
                },
            })
        });
        return result;
    }

    async openGlobalAction(title: string, data: cbRecord[], onDismissCallback: (code: number) => void, selectedVal?: any) {
      const actions = await this.actionCtrl.create({
        header: title,
        mode: "ios",
        buttons: this.getActionBtns(data, selectedVal)
      });
      await actions.present();
      const returnedData = (await actions.onDidDismiss()).data;
      if (returnedData) {
          onDismissCallback(returnedData);
      }
    }

    onSelectRoute(ev: any) {
      // this.openGlobalAction("Επιλογή διαδρομής", this.routes, (returnedCode: number) => {
      //   this.selectedRoute = returnedCode;
      //   this.backendSrv.getRouteByCode(this.selectedRoute).pipe(
      //     switchMap((data) => {
      //       this.line.routes = [data];
      //       return this.backendSrv.getBusLocation(data.route_code);
      //     })
      //   ).subscribe(
      //     (response) => {
      //       if(response) {
      //         this.mapSrv.addBusPosition(response);
      //       }
      //     },
      //     (error) => {
      //       console.log("Error occured on route retrieve. [" +  JSON.stringify(error) + "].");
      //     },
      //     async () => {
      //       this.drawRoute = await this.mapSrv.drawRoute(this.selectedRoute);
      //     }
      //   )
      // });
    }

    async onSelectAltLine(ev: any) {
      this.openGlobalAction(await firstValueFrom(this.translate.get("ALT_LINES")), this.altLines.map((val) => {
        return {code: val.line_code, descr: this.appSrv.language === 'el' ? val.line_descr : val.line_descr_eng}
      }),
        (returnedCode: number) => {
          this.loadFullLine(returnedCode);
        },
        this.line_code
      );
    }

    onSelectSchedule(ev: any) {
      this.openGlobalAction("Προγράμματα",
        this.lineSchedules.map((val, indx, arr) => {
          return {
            code: val.sdc_code,
            descr: val.sdc_descr
          }
        }),
        (returnedCode: number) => {
          this.selectedSched = returnedCode;
          this.back02.getScheduleDetails(returnedCode, this.line.line_code).subscribe(
            (response) => {
              this.selectedSchedule = response;
            },
            (error) => {
              console.log("Error occured on get schedule details [" + JSON.stringify(error) + "].");
            },
            () => {
              this.itsTime(Direction.come);
              this.itsTime(Direction.go)
            }
          )
        }
      );
    }

    getSelectedRouteDescr() {
        const result = this.routes.find(rec =>
            rec.code === this.selectedRoute
        )?.descr;

        return result;
    }

    async onSegmentChange(ev: any) {
      console.log("Segmet event ", ev);
      this.disableBusLocationInterval();
      this.disableScheduleInterval();
      if(ev.detail.value === "third") {

        // Αυτή εδώ πρέπει να γίνει Promise
        // Εφόσον πάρουν όλα τα δεδομένα για την σχεδίαση της διδρομής μετά
        // να πάρει τις θέσεις των λεοφορείων.
        this.drawRoute = await this.mapSrv.drawRoute(this.selectedRoute);
        this.enableBusLocationInterval();

      } else if(ev.detail.value === "first") {
        this.enableScheduleInterval();
      }
    }

    private enableScheduleInterval() {
      this.itsTime(Direction.go);
      console.log("🚀~ Interval for itsTime Direction GO ran for first time...");
      this.itsTime(Direction.come);
      console.log("🚀~ Interval for itsTime Direction COME ran for first time...");
      this._scheduleInterval = setInterval(() => {
        this.itsTime(Direction.go);
        console.log("🚀~ Interval for itsTime Direction GO ran for first time...");
        this.itsTime(Direction.come);
        console.log("🚀~ Interval for itsTime Direction COME ran for first time...");
      }, 5000);
    }

    private disableScheduleInterval() {
      clearInterval(this._scheduleInterval);
    }

    private disableBusLocationInterval() {
      clearInterval(this._busLocatInterval);
    }

    private enableBusLocationInterval() {
      this.backendSrv.getBusLocation(this.selectedRoute).subscribe(
        (vals) => {
          this.mapSrv.addBusPosition(vals);
        },
        (error) => {
          console.log("❌ Error occured on Bus location request.", error);
        },
        () => {
          this._busLocatInterval = setInterval(() => {
            this.backendSrv.getBusLocation(this.selectedRoute).subscribe(
              (vals) => {
                this.mapSrv.addBusPosition(vals);
              }
            );
          }, 20000);
        }
      );
    }

    getSelectedAltLineDescr() {
        const result = this.altLines.find(rec =>
            rec.line_code === this.line_code
        );
        if(!result) {
          return;
        }

        return this.appSrv.language === 'el' ? result.line_descr : result.line_descr_eng;
    }

    getSelectedSchedDescr() {
      const result = this.lineSchedules.find(rec =>
          rec.sdc_code === this.selectedSched
      )?.sdc_descr;

      return result;
    }

    getSelectedRoute() {
        //debugger;
        // return this.line.routes.find(x => x.route_code === this.selectedRoute);
    }

    onBackdrop(ev: any) {
        this.modalCtrl.dismiss();
    }

    filterAboutDirection(direction: number): ScheduleTimes[] {
        return this.selectedSchedule.times.filter(x => x.direction === direction);
    }

    showList(direction: number): boolean {
      if(!this.selectedSchedule) {
        return false;
      }
      return this.selectedSchedule.times.filter(x => x.direction === direction).length > 0;
    }

    getLineCode() {
      return this.line ? this.line.line_code : -1;
    }

    getLineId() {
      return this.line ? this.line.line_id : "";
    }

    itsTime(direction: number) {
      // filter only one directoin Times
      // const directionTimes = this.selectedSchedule.times.filter(x => x.direction === direction);

      // if(directionTimes.length > 0) {
      //   // debugger;
      //   const nowDate = new Date();

      //   //get Time for NOW
      //   const now = nowDate.getTime();

      //   const nowDateStr = this.datePipe.transform(now, "yyyy-MM-dd");
      //   const previousTime = directionTimes.find(x => x.itsTime === true);
      //   if (previousTime) {
      //     previousTime.itsTime = false;
      //   }
      //   const nextTime = directionTimes.find(x => (new Date(nowDateStr + "T" + x.start_time).getTime() - now) >=0);
      //   if(nextTime) {
      //     nextTime.itsTime = true;
      //   }

      //   if(directionTimes.findIndex(x => x.itsTime === true) == -1) {
      //     directionTimes[0].itsTime = true;
      //   }
      // }
    }

    addOnFavLine() {
      this.lineSrv.addOrRemoveLineToFavorite({...this.line});
    }

    async onOpenStop(ev: any, stop_code: number) {
      const modal = await this.modalCtrl.create({
        component: StopPage,
        componentProps: {
          stop_code: stop_code
        }
      });

      await modal.present();
    }

    get isBus() {
      return LINE_TYPE.BUS;
    }

    get isTrolley() {
      return LINE_TYPE.TROLLEY;
    }

    get borderStyle() {
      return `solid 3px ${this.line?.line_type === LINE_TYPE.BUS ? '#0054e9' : '#ffb800'}`;
    }

    get imageSrc() {
      return this.line?.line_type === LINE_TYPE.BUS ? '../../../assets/images/bus_release.png' : '../../../assets/images/trolley-bus-release.png';
    }

}

