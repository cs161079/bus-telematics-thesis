import { firstValueFrom } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { Line, LINE_TYPE } from '../models/lines.interface';
import { BackendService } from '../service/backend.service';
import { NavigationService } from '../service/navigation.service';
import { debounceTime, Subscription } from 'rxjs';
import { LineService } from '../service/line.service';
import { AppService } from '../service/application.service';
import { BackendService02 } from '../service/backend02.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit {
  lines: Line[] = [];
  recentLines: Line[] = [];
  searchText: string = "";
  isLoading: boolean = false;
  skeletonArray = [1,2];

  private $onLanguageChangeSubscription!: Subscription;

  constructor(
    private backend: BackendService,
    private backend02: BackendService02,
    private navSrv: NavigationService,
    public lineSrv: LineService,
    private appSrv: AppService,
    private translate: TranslateService
  ) {

  }

  // ngOnDestroy(): void {

  // }

  ngOnInit(): void {
    console.log("ngOnInit ")
  }

  ionViewDidEnter() {
    this.$onLanguageChangeSubscription = this.appSrv.onLanguageChange.subscribe(
      async (currentLang) => {
        debugger;
        if(currentLang) {
          this.navSrv.activeTitle.next(this.translate.instant("LINE_SEARCH"));
          this.getLineData();
        }
      }
    );
  }

  ionViewWillLeave() {
    if(this.$onLanguageChangeSubscription) {
      this.$onLanguageChangeSubscription.unsubscribe();
    }
  }

  getLineData() {
    this.isLoading = true;
    this.backend02.getLines().subscribe(
      (data) => {
        this.lines = data;
      },
      (error) => {
        console.log("Error occured ", error);
        this.isLoading = false;
      },
      () => {
        this.isLoading = false;
      }
    )
  }

  clearSearch() {
    this.searchText = "";
  }


  async onSelectLine(line: Line) {
    this.lineSrv.openLinePage(line);
  }

  onSearchChange(ev: any) {
    console.log("Search input changed!!!", ev);
  }

  onInputChange(ev: any) {
    debounceTime(10000);
    console.log("Search change and event is ", ev);
    this.backend.lineSearch(ev.detail.value).subscribe((values) => {
      this.lines = values;
    });
  }

  getLineIcon(lineId: string): boolean {
    const result = Number(lineId);
    console.log("Απο τη μετατροπή ", result);
    return result> 1 && result< 25;
  }

  get busType() {
    return LINE_TYPE.BUS;
  }

  get trolleyType() {
    return LINE_TYPE.TROLLEY;
  }

}
