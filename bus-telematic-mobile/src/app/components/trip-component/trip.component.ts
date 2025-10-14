import { Component, Input } from "@angular/core";
import { ModeTrip, TripPart, TripPlan } from "src/app/models/trip_plan.interface";

export interface TripInput {

}
@Component({
  selector: "app-trip",
  templateUrl: "trip.component.html",
  styleUrl: "trip.component.scss"
})
export class TripComponent {
  @Input()
  trip!: TripPlan;

  @Input()
  selected!: boolean;

  constructor() {

  }

  get BusMode() {
    return ModeTrip.BUS;
  }

  get WalkMode() {
    return ModeTrip.WALK;
  }

  durationInMinutes(durationsScd: number) {
    return Math.floor(durationsScd / 60);
  }

  calculateTripDuartion(duration: number) {
    return Math.floor(duration / 60);
  }
}
