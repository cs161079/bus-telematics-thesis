/// <reference types="@angular/localize" />

import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { bootstrapApplication } from '@angular/platform-browser';
import moment from 'moment';

moment.locale('el');
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

