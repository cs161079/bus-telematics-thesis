import { App } from '@capacitor/app';
import { Component } from '@angular/core';
import { NavigationService } from '../service/navigation.service';
import { LineService } from '../service/line.service';
import { Line, LINE_TYPE, Stop } from '../models/lines.interface';
import { StopService } from '../service/stop.service';
import { Subscription } from 'rxjs';
import { AppService } from '../service/application.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page {
  private onChangeLanguage$!: Subscription;
  constructor(
    private navSrv: NavigationService,
    public lineSrv: LineService,
    public stopSrv: StopService,
    private appSrv: AppService,
    private translate: TranslateService
  ) {}

  ionViewDidEnter() {
    this.onChangeLanguage$ = this.appSrv.onLanguageChange.subscribe((lang) => {
      this.navSrv.activeTitle.next(this.translate.instant("FAVORITES"));
    });
  }

  ionViewWillLeave() {
    if (this.onChangeLanguage$) {
      this.onChangeLanguage$.unsubscribe();
    }
  }

  // getFavoriteLines() {
  //   this.lineSrv.getFavoriteLines().subscribe((vals) => {
  //     this.favLines = vals;
  //   });
  //   // return this.lineSrv.getFavoriteLines();
  // }

  getStopDescr(st: Stop) {
    return this.appSrv.language === 'el' ? st.stop_descr : st.stop_descr_eng;
  }

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
