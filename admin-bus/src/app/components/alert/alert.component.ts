import { Component, Input } from "@angular/core";
import { AlertRec, AlertType } from "../../models/models.interface";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-alert",
  templateUrl: "alert.component.html",
  styleUrl: "alert.component.scss",
  standalone: true,
  imports: [CommonModule]
})
export class AlertComponent {

  private _alertRec: AlertRec | null | undefined;
  constructor() {

  }

  @Input()
  set alert(alert: AlertRec | null | undefined) {
    this._alertRec = alert;
  }

  get alert() {
    return this._alertRec;
  }

  getAlertClass() {
    if(this._alertRec?.type === AlertType.DANGER) {
      return "alert-danger"
    } else if(this._alertRec?.type === AlertType.WARNING) {
      return "alert-warning"
    } else {
      return "alert-success"
    }
  }
}
