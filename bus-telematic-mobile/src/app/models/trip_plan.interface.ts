export interface TripPlan {
  duration: number;
  startTime: number;
  endTime: number;
  walkTime: number;
  transitTime: number;
  walkDistance: number;
  parts: TripPart[];
}

export interface TripPart {
  startTime: number;
  endTime: number;
  distance: number;
  mode: string;
  duration: number;
  route: string;
  routeShortName: string;
  steps: Step[];
  from: LocationPoint;
  to: LocationPoint;
  legGeometry: LegGeometry;
}

export interface LegGeometry {
  points: string;
  length: number;
}

export interface Step {
  distance: number;
  relativeDirection: string;
  streetName: string;
  absoluteDirection: string;
  stayOn: boolean;
  area: boolean;
  bogusName: boolean;
  lon: number;
  lat: number;
  elevation: string;
  walkingBike: boolean;
}

export interface LocationPoint {
  name: string;
  lat: number;
  lon: number;
  vertexType: string;
  departure?: number; // optional, only on 'from'
  arrival?: number;   // optional, only on 'to'
}

export enum ModeTrip {
  WALK="WALK",
  BUS= "BUS"
}
