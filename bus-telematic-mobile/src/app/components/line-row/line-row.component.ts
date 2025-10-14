import { Component, Input } from "@angular/core";
import { Line, LINE_TYPE } from "src/app/models/lines.interface";

@Component({
  selector: "app-line",
  templateUrl: "line-row.component.html",
  styleUrl: "line-row.component.scss"
})
export class LineRowComponent {

  private _lineRec!: Line;
  constructor() {

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
}
