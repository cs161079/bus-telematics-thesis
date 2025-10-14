import { Injectable } from "@angular/core";
import { Stop } from "../models/lines.interface";
import { BehaviorSubject, Observable, of } from "rxjs";
import { StorageService } from "./storage.service";
import { ModalController } from "@ionic/angular";
import { StopPage } from "../stopPage/stop.page";

@Injectable({
  providedIn: "root"
})
export class StopService {
  stopSet!: Set<number>;
  favoriteStopSub!: BehaviorSubject<Stop[]>;
  constructor(
    private storageSrv: StorageService,
    private modalCtrl: ModalController
  ) {
    this.favoriteStopSub = new BehaviorSubject<Stop[]>([]);
    this.initiliazeStopSet();
  }

  private initiliazeStopSet() {
      this.storageSrv.getValue("favorite_stops").then((vals: Stop[]) => {
        this.stopSet = new Set();
        if(vals && vals.length > 0) {
          this.favoriteStopSub.next(vals);
          vals.forEach((stop) => {
            this.stopSet.add(stop.stop_code);
          });
        }
      });
    }

  async addOrRemoveStopToFavorite(stop: Stop) {
    debugger;
      let favStops: Stop[] = await this.storageSrv.getValue("favorite_stops");
      if(!favStops) {
        favStops = [];
      }
      if(this.stopSet?.has(stop.stop_code)) {
        //Remove Line from favorite
        favStops.splice(favStops.findIndex(x => x.stop_code === stop.stop_code), 1);
        this.stopSet.delete(stop.stop_code);
      } else {
        if(favStops.findIndex(x => x.stop_code === stop.stop_code) === -1) {
          favStops.push(stop);
          this.stopSet.add(stop.stop_code);
        }
      }
      this.favoriteStopSub.next(favStops);
      this.storageSrv.setValue("favorite_stops", favStops);
    }

  // Simulate the favorite checking method
    isFavStop(stopCode: number): Observable<boolean> {
      const result = this.stopSet?.has(stopCode);
      return of(result);
    }

    async openStopPage(stop: Stop) {
      const modal = await this.modalCtrl.create({
        component: StopPage,
        componentProps: {
          stop_code: stop.stop_code
        }
      });

      await modal.present();
    }

}
