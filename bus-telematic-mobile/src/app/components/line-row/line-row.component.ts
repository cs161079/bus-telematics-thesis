import { Component, Input } from "@angular/core";
import { Line, LINE_TYPE } from "src/app/models/lines.interface";
import { AppService } from "src/app/service/application.service";

@Component({
  selector: "app-line",
  templateUrl: "line-row.component.html",
  styleUrl: "line-row.component.scss"
})
export class LineRowComponent {

  private _lineRec!: Line;
  constructor(
    private appSrv: AppService
  ) {

  }

  get line() {
    return this._lineRec;
  }

  @Input()
  set line(inRec: Line) {
    this._lineRec = inRec;
  }

  get busType() {
      return LINE_TYPE.BUS;
    }

    get trolleyType() {
      return LINE_TYPE.TROLLEY;
    }

    getLineDescription(rec: Line) {
      return this.appSrv.language === 'el' ? rec.line_descr : rec.line_descr_eng;
    }
}
