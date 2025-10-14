import { LINE_TYPE } from "./lines.interface";

export interface BusArrival {
  route_code: number;
  route_descr: string;
  line_code: number;
  line_id: string;
  line_type: LINE_TYPE;
  veh_vode: number;
  time: number;
  next_time: number;
  last_time: number;
  passenger: number;
  capacity: number;
}

export interface BusLocation {
  veh_code: number;
  cs_date: string;
  cs_lat: number;
  cs_lng: number;
  route_code: number;
}
