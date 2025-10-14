import { Component } from '@angular/core';
import { NavigationService } from '../service/navigation.service';
import { LineService } from '../service/line.service';
import { Line, LINE_TYPE, Stop } from '../models/lines.interface';
import { StopService } from '../service/stop.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page {
  constructor(
    private navSrv: NavigationService,
    public lineSrv: LineService,
    public stopSrv: StopService
  ) {}

  ionViewDidEnter() {
    this.navSrv.activeTitle.next("Αγαπημένα");
    // this.getFavoriteLines();
  }

  // getFavoriteLines() {
  //   this.lineSrv.getFavoriteLines().subscribe((vals) => {
  //     this.favLines = vals;
  //   });
  //   // return this.lineSrv.getFavoriteLines();
  // }

  onSelectLine(ln: Line) {
    this.lineSrv.openLinePage(ln);
  }

  onSelectStop(stop: Stop) {
    this.stopSrv.openStopPage(stop);
  }

  get isBusLine() {
    return LINE_TYPE.BUS;
  }
}
