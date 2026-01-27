import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class NavigationService {
  private _activeTitle!: BehaviorSubject<string | undefined>;

  constructor() {
    this._activeTitle = new BehaviorSubject<string | undefined>(undefined);
  }

  get activeTitle() {
    return this._activeTitle;
  }

}
