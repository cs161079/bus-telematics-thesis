import { Injectable } from "@angular/core";
import { Line } from "../models/lines.interface";
import { StorageService } from "./storage.service";
import { BehaviorSubject, from, Observable, of } from "rxjs";
import { LinePage } from "../linePage/line.page";
import { ModalController } from "@ionic/angular";

@Injectable({
  providedIn: "root"
})
export class LineService {
  lineSet!: Set<number>;
  recentLinesSub!: BehaviorSubject<Line[]>;
  favoriteLineSub!: BehaviorSubject<Line[]>;

  constructor(
    private storageSrv: StorageService,
    private modalCtrl: ModalController
  ) {
    this.recentLinesSub = new BehaviorSubject<Line[]>([]);
    this.favoriteLineSub = new BehaviorSubject<Line[]>([]);
    this.refreshFavLineSet();
  }

  refreshFavLineSet() {
    this.storageSrv.getValue("favorite").then((vals: Line[]) => {
      this.lineSet = new Set();
      if(vals && vals.length > 0) {
        this.favoriteLineSub.next(vals);
        vals.forEach((line) => {
          this.lineSet.add(line.line_code);
        });
      }
    });

    this.storageSrv.getValue("recent").then((vals: Line[]) => {
      if(vals && vals.length > 0) {
        this.recentLinesSub.next(vals);
      }
    });
  }

  async addOrRemoveLineToFavorite(line: Line) {
    let favLines: Line[] = await this.storageSrv.getValue("favorite");
    if(!favLines) {
      favLines = [];
    }
    if(this.lineSet?.has(line.line_code)) {
      //Remove Line from favorite
      favLines.splice(favLines.findIndex(x => x.line_code === line.line_code), 1);
      this.lineSet.delete(line.line_code);
    } else {
      if(favLines.findIndex(x => x.line_code === line.line_code) === -1) {
        favLines.push(line);
        this.lineSet.add(line.line_code);
      }
    }
    this.favoriteLineSub.next(favLines);
    this.storageSrv.setValue("favorite", favLines);
  }

  async addRecentLine(line: Line) {
    // debugger;
    let recentLines: Line[] = await this.storageSrv.getValue("recent");
    if(!recentLines) {
      recentLines = [];
    }

    const existIndex = recentLines.findIndex(x => x.line_code === line.line_code);
    if(existIndex !== -1) {
      recentLines.splice(existIndex, 1);
    }

    if(recentLines.length === 5) {
      recentLines.splice(recentLines.length - 1, 1);
    }


    recentLines.push(line);
    this.shiftRight(recentLines);
    this.recentLinesSub.next(recentLines);
    this.storageSrv.setValue("recent", recentLines);
  }

  shiftRight(arr: any[]) {
    if (arr.length > 0) {
      let last = arr.pop(); // Remove last element
      arr.unshift(last!); // Insert it at the beginning
    }
  }

  // Simulate the favorite checking method
  isFavLines(lineCode: number): Observable<boolean> {
    const result = this.lineSet?.has(lineCode);
    return of(result);
  }

  getFavoriteLines(): Observable<Line[]> {
    return from(this.storageSrv.getValue("favorite"));
  }

  async openLinePage(line: Line) {
    this.addRecentLine(line);
    const modal = await this.modalCtrl.create({
      component: LinePage,
      componentProps: {
        line_code: line.line_code
      }
    });

    await modal.present();
  }

}
