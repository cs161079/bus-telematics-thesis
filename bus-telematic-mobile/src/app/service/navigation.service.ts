import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class NavigationService {
  private _activeTitle!: BehaviorSubject<string>;

  constructor() {
    this._activeTitle = new BehaviorSubject<string>("");
  }

  get activeTitle() {
    return this._activeTitle;
  }

}
