import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { BackendService } from "../service/backend.service";
import { map, switchMap } from "rxjs";
import { cbRecord, Direction, LINE_TYPE, LineDto, ScheduleTime } from "../models/lines.interface";
import { ActionSheetButton, ActionSheetController, ModalController } from "@ionic/angular";
import { DatePipe } from "@angular/common";
import { LineService } from "../service/line.service";
import { StorageService } from "../service/storage.service";
import { StopPage } from "../stopPage/stop.page";
import * as L from "leaflet";
import {antPath} from "leaflet-ant-path";
import { MapService } from "../service/map.service";

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

  @Input()
  line_code: number = -1;

  routes: cbRecord[] = [];
  sches: cbRecord[] = [];
  altLines: cbRecord[] = [];
  line!: LineDto;
  selectedSched!: number;
  selectedRoute!: number;
  selectedAltLine!: number;

  drawRoute!: any;

  constructor(
      private backendSrv: BackendService,
      private actionCtrl: ActionSheetController,
      private modalCtrl: ModalController,
      private datePipe: DatePipe,
      public lineSrv: LineService,
      private storageSrv: StorageService,
      private mapSrv: MapService
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

  getLineInformation(line_code: number) {
      this.line_code = line_code;
      this.backendSrv.getLineCbs(this.line_code).pipe(
          switchMap((val) => {
              this.routes = val.routesCb;
              this.sches = val.sdcCb;
              return this.backendSrv.getLineByCode(this.line_code);
          }),
          switchMap((val) => {
              this.line = val;
              this.selectedRoute = val.routes[0].route_code;
              this.selectedSched = val.schedule.sdc_code;
              return this.backendSrv.getAltLineCbs(this.line.line_id);
          })
      ).subscribe(
          (val) => {
              this.selectedAltLine = this.line.line_code;
              this.altLines = val;
          },
          (error) => {
              console.log("Error Occured ", error);
          },
          () => {
            console.log("🚀~ onSelectAltLine()");
            this.itsTime(Direction.come);
            this.itsTime(Direction.go);
          }
      );
  }

  ionViewWillEnter() {
      this.getLineInformation(this.line_code);
  }

    private getActionBtns(dataArr: cbRecord[]): ActionSheetButton[] {
        let result: ActionSheetButton[] = [];
        dataArr.forEach((rec) => {
            result.push({
                text: rec.descr,
                data: rec.code,
                handler() {
                    console.log(`Recod with code ${rec.code} and Description ${rec.descr} is selected.`);
                },
            })
        });
        return result;
    }

    async openGlobalAction(title: string, data: cbRecord[], onDismissCallback: (code: number) => void) {
      const actions = await this.actionCtrl.create({
        header: title,
        mode: "ios",
        buttons: this.getActionBtns(data)
      });
      await actions.present();
      const returnedData = (await actions.onDidDismiss()).data;
      if (returnedData) {
          onDismissCallback(returnedData);
      }
    }

    onSelectRoute(ev: any) {
      this.openGlobalAction("Επιλογή διαδρομής", this.routes, (returnedCode: number) => {
        this.selectedRoute = returnedCode;
        this.backendSrv.getRouteByCode(this.selectedRoute).pipe(
          switchMap((data) => {
            this.line.routes = [data];
            return this.backendSrv.getBusLocation(data.route_code);
          })
        ).subscribe(
          (response) => {
            if(response) {
              this.mapSrv.addBusPosition(response);
            }
          },
          (error) => {
            console.log("Error occured on route retrieve. [" +  JSON.stringify(error) + "].");
          },
          async () => {
            this.drawRoute = await this.mapSrv.drawRoute(this.selectedRoute);
          }
        )
      });
    }

    onSelectAltLine(ev: any) {
      this.openGlobalAction("Εναλλακτική Γραμμή", this.altLines, (returnedCode: number) => {
        this.selectedAltLine = returnedCode;
        this.getLineInformation(this.selectedAltLine);
      });
    }

    onSelectSchedule(ev: any) {
      this.openGlobalAction("Προγράμματα", this.sches, (returnedCode: number) => {
        this.selectedSched = returnedCode;
        this.backendSrv.getScheduleDetails(returnedCode, this.line.line_code).subscribe(
          (response) => {
            this.line.schedule = response;
          },
          (error) => {
            console.log("Error occured on get schedule details [" + JSON.stringify(error) + "].");
          },
          () => {
            this.itsTime(Direction.come);
            this.itsTime(Direction.go)
          }
        )
      });
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

    getSelectedRAltLineDescr() {
        const result = this.altLines.find(rec =>
            rec.code === this.selectedAltLine
        )?.descr;

        return result;
    }

    getSelectedSchedDescr() {
      const result = this.sches.find(rec =>
          rec.code === this.selectedSched
      )?.descr;

      return result;
  }

    getSelectedRoute() {
        //debugger;
        return this.line.routes.find(x => x.route_code === this.selectedRoute);
    }

    onBackdrop(ev: any) {
        this.modalCtrl.dismiss();
    }

    filterAboutDirection(direction: number): ScheduleTime[] {
        return this.line.schedule.times.filter(x => x.direction === direction);
    }

    showList(direction: number): boolean {
        return this.line?.schedule.times.filter(x => x.direction === direction).length > 0;
    }

    getLineCode() {
      return this.line ? this.line.line_code : -1;
    }

    getLineId() {
      return this.line ? this.line.line_id : "";
    }

    itsTime(direction: number) {
      // filter only one directoin Times
      const directionTimes = this.line.schedule.times.filter(x => x.direction === direction);

      if(directionTimes.length > 0) {
        // debugger;
        const nowDate = new Date();

        //get Time for NOW
        const now = nowDate.getTime();

        const nowDateStr = this.datePipe.transform(now, "yyyy-MM-dd");
        const previousTime = directionTimes.find(x => x.itsTime === true);
        if (previousTime) {
          previousTime.itsTime = false;
        }
        const nextTime = directionTimes.find(x => (new Date(nowDateStr + "T" + x.start_time).getTime() - now) >=0);
        if(nextTime) {
          nextTime.itsTime = true;
        }

        if(directionTimes.findIndex(x => x.itsTime === true) == -1) {
          directionTimes[0].itsTime = true;
        }
      }
    }

    addOnFavLine() {
      this.lineSrv.addOrRemoveLineToFavorite(this.line);
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

