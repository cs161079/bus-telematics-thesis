import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TabsPageRoutingModule } from './tabs-routing.module';

import { TabsPage } from './tabs.page';
import { LinePage } from '../linePage/line.page';
import { StopPage } from '../stopPage/stop.page';
import { AppComponentModule } from "../components/app-components.module";

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TabsPageRoutingModule,
    AppComponentModule
],
  declarations: [TabsPage, LinePage]
})
export class TabsPageModule {}
