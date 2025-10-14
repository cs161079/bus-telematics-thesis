export interface Line {
    line_code: number;
    line_id: string;
    line_descr: string;
    line_type: LINE_TYPE;
}

export enum LINE_TYPE {
  BUS= 0,
  TROLLEY = 1
}

export interface LineDto {
    ml_code: number;
   sdc_code: number;
   line_code: number;
   line_id: string;
   line_descr: string;
   line_type: LINE_TYPE;
   routes: RouteDto[];
   schedule: ScheduleMaster
}

export interface ScheduleMaster {
    sdc_code: number;
    sdc_descr: string;
    times: ScheduleTime[];
}

export interface ScheduleTime {
    direction: number;
    end_time: string
    line_code: number;
    sdc_code: number;
    sort: number;
    start_time: string;
    itsTime: boolean;
}

export interface RouteDto {
    route_code: number;
    route_desc: string;
    route_distance: number;
    stops: Stop[]
}

export interface StopDto {
    stop: Stop
}

export interface LineStopInfo {
  line_id: string;
  line_type: LINE_TYPE;
}

export interface Stop {
    stop_code: number;
    stop_id: string;
    stop_descr: string;
    lines: LineStopInfo[]
}

export interface cbRecord {
    code: number;
    descr: string;
}

export interface LineCbs {
    routesCb: cbRecord[];
    sdcCb: cbRecord[];
}

export enum Direction {
    go = 1,
    come = 0
}

/*
const Direction_GO = 1
const Direction_COME = 0
*/
