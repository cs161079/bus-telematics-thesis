// export interface StopInfo {
//   stop_code: number;
//   stop_descr: string;
// }

export interface BasicStopDto {
  stop_code: number;
  stop_descr: string;
  stop_lat: number;
  stop_lng: number;
}

export interface CloseStops extends BasicStopDto{
	stop_street: string;
	distance: number;
}

export interface RouteStop extends BasicStopDto{
  stop_senu: number;
}
