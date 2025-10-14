import { NgModule } from "@angular/core";
import { LineRowComponent } from "./line-row/line-row.component";
import { IonicModule } from "@ionic/angular";
import { CommonModule } from "@angular/common";
import { StopPage } from "../stopPage/stop.page";
import { TripComponent } from "./trip-component/trip.component";

@NgModule({
  imports: [
    IonicModule,
    CommonModule
  ],
  declarations: [
    StopPage,
    LineRowComponent,
    TripComponent
  ],
  exports: [
    LineRowComponent,
    StopPage,
    TripComponent
  ]
})
export class AppComponentModule {}
