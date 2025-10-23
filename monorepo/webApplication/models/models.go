package models

type CustomPoint struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type Trip struct {
	Duration     int     `json:"duration"`
	StartTime    int64   `json:"startTime"`
	EndTime      int64   `json:"endTime"`
	WalkTime     int     `json:"walkTime"`
	TransitTime  int     `json:"transitTime"`
	WalkDistance float64 `json:"walkDistance"`
	Parts        []Part  `json:"parts"`
}

type Part struct {
	StartTime      int64       `json:"startTime"`
	EndTime        int64       `json:"endTime"`
	Distance       float64     `json:"distance"`
	Mode           string      `json:"mode"`
	Duration       float32     `json:"duration"`
	AgencyName     string      `json:"agencyName,omitempty"`
	Route          string      `json:"route"`
	RouteShortName string      `json:"routeShortName,omitempty"`
	RouteLongName  string      `json:"routeLongName,omitempty"`
	Steps          []Step      `json:"steps"`
	From           LegPoint    `json:"from"`
	To             LegPoint    `json:"to"`
	LegGeometry    LegGeometry `json:"legGeometry"`
}
