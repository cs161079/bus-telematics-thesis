package models

type StopArrivalOasa struct {
	Btime2     int32 `json:"btime2" oasa:"btime2"`
	Route_code int32 `json:"route_code" oasa:"route_code"`
	Veh_code   int32 `json:"veh_code" oasa:"veh_code"`
}

type StopArrival struct {
	Btime2        int32  `json:"time"`
	Route_code    int32  `json:"route_code"`
	LineCode      int32  `json:"line_code"`
	RouteDescr    string `json:"route_descr"`
	RouteDescrEng string `json:"route_descr_eng"`
	LineType      int8   `json:"line_type"`
	Veh_code      int32  `json:"veh_code"`
	Line_id       string `json:"line_id"`
	NextTime      int32  `json:"next_time"`
	Last_Time     int32  `json:"last_time"`
	Passengers    int    `json:"passengers"`
	Capacity      int    `json:"capacity"`
}

type BusLocation struct {
	Veh_code   int32   `json:"veh_code" oasa:"VEH_NO"`
	Cs_date    string  `json:"cs_date" oasa:"CS_DATE"`
	Cs_lat     float64 `json:"cs_lat" oasa:"CS_LAT"`
	Cs_lng     float64 `json:"cs_lng" oasa:"CS_LNG"`
	Route_code int32   `json:"route_code" oasa:"ROUTE_CODE"`
}

type BusΟccupancy struct {
	Capacity   int `json:"capacity"`
	Passengers int `json:"passengers"`
}
