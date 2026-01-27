import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { App } from '@capacitor/app';
import { Injectable } from "@angular/core";
import { Platform } from "@ionic/angular";
import { StorageService } from './storage.service';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AppInfo {
  name: string;
  version: string;
}

@Injectable({
  providedIn: "root"
})
export class AppService {
  private _language: string = 'el';

  onLanguageChange: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(undefined);

  get language(): string {
    return this._language;
  }

  // set language(lang: string) {
  //   this._language = lang;
  // }

  async useLanguage(lang: string) {
    this._language = lang;
    this.storage.setValue('language', lang);
    await firstValueFrom(this.transalte.use(lang));
    this.onLanguageChange.next(lang);
  }

  constructor(
    private plt: Platform,
    private storage: StorageService,
    private transalte: TranslateService
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
