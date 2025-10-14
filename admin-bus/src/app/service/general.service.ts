import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { AlertRec, AlertType } from "../models/models.interface";

@Injectable({
  providedIn: "root"
})
export class GeneralSerivce {

  private _alerts: BehaviorSubject<AlertRec | undefined>;
  constructor() {
    this._alerts = new BehaviorSubject<AlertRec | undefined>(undefined);
  }


  private internallAlert(timeOut?: number) {
    setTimeout(() => {
      this.dismissAlert();
    }, timeOut ? timeOut : 10000)
  }

  showInfoAlert(iMess: string, timeOut?: number) {
    this._alerts.next({
      message: iMess,
      type: AlertType.INFO
    });
    this.internallAlert(timeOut);
  }

  showWarningAlert(iMess: string, timeOut?: number) {
    this._alerts.next({
      message: iMess,
      type: AlertType.WARNING
    });
    this.internallAlert(timeOut);
  }

  showDangerAlert(iMess: string, timeOut?: number) {
    this._alerts.next({
      message: iMess,
      type: AlertType.DANGER
    });
    this.internallAlert(timeOut);
  }

  dismissAlert() {
    this._alerts.next(undefined);
  }

  get alerts() {
    return this._alerts;
  }

}
