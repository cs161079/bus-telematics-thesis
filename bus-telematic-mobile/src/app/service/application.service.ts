import { environment } from 'src/environments/environment';
import { App } from '@capacitor/app';
import { Injectable } from "@angular/core";
import { Platform } from "@ionic/angular";

export interface AppInfo {
  name: string;
  version: string;
}

@Injectable({
  providedIn: "root"
})
export class AppService {
  constructor(
    private plt: Platform
  ) {

  }

  getApplicaitonInfo(): Promise<AppInfo> {
    return new Promise<AppInfo>(async (resolve, reject) => {
      if(this.plt.is("android") || this.plt.is("ios")) {
        const appInfo = await App.getInfo();
        resolve({name: appInfo.name, version: appInfo.version});
      } else {
        resolve(environment.app)
      }
    });
  }
}
