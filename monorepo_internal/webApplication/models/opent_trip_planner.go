package models

type OTPResponse struct {
	RequestParameters  RequestParameters `json:"requestParameters"`
	Plan               Plan              `json:"plan"`
	Metadata           Metadata          `json:"metadata"`
	PreviousPageCursor string            `json:"previousPageCursor"`
	NextPageCursor     string            `json:"nextPageCursor"`
	DebugOutput        DebugOutput       `json:"debugOutput"`
	ElevationMetadata  ElevationMetadata `json:"elevationMetadata"`
}

type RequestParameters struct {
	Mode      string `json:"mode"`
	FromPlace string `json:"fromPlace"`
	ToPlace   string `json:"toPlace"`
}

type Plan struct {
	Date        int64       `json:"date"`
	From        Location    `json:"from"`
	To          Location    `json:"to"`
	Itineraries []Itinerary `json:"itineraries"`
}

type Location struct {
	Name       string  `json:"name"`
	Lon        float64 `json:"lon"`
	Lat        float64 `json:"lat"`
	VertexType string  `json:"vertexType"`
}

type Itinerary struct {
	Duration                              int     `json:"duration"`
	StartTime                             int64   `json:"startTime"`
	EndTime                               int64   `json:"endTime"`
	WalkTime                              int     `json:"walkTime"`
	TransitTime                           int     `json:"transitTime"`
	WaitingTime                           int     `json:"waitingTime"`
	WalkDistance                          float64 `json:"walkDistance"`
	WalkLimitExceeded                     bool    `json:"walkLimitExceeded"`
	GeneralizedCost                       int     `json:"generalizedCost"`
	ElevationLost                         int     `json:"elevationLost"`
	ElevationGained                       int     `json:"elevationGained"`
	Transfers                             int     `json:"transfers"`
	Fare                                  Fare    `json:"fare"`
	Legs                                  []Leg   `json:"legs"`
	TooSloped                             bool    `json:"tooSloped"`
	ArrivedAtDestinationWithRentedBicycle bool    `json:"arrivedAtDestinationWithRentedBicycle"`
}

type Fare struct {
	Fare    map[string]interface{} `json:"fare"`
	Details map[string]interface{} `json:"details"`
}

type Leg struct {
	StartTime                int64       `json:"startTime"`
	EndTime                  int64       `json:"endTime"`
	DepartureDelay           int         `json:"departureDelay"`
	ArrivalDelay             int         `json:"arrivalDelay"`
	RealTime                 bool        `json:"realTime"`
	Distance                 float64     `json:"distance"`
	GeneralizedCost          int         `json:"generalizedCost"`
	Pathway                  bool        `json:"pathway"`
	Mode                     string      `json:"mode"`
	TransitLeg               bool        `json:"transitLeg"`
	Route                    string      `json:"route"`
	AgencyTimeZoneOffset     int         `json:"agencyTimeZoneOffset"`
	InterlineWithPreviousLeg bool        `json:"interlineWithPreviousLeg"`
	From                     LegPoint    `json:"from"`
	To                       LegPoint    `json:"to"`
	LegGeometry              LegGeometry `json:"legGeometry"`
	Steps                    []Step      `json:"steps"`
	RentedBike               bool        `json:"rentedBike"`
	WalkingBike              bool        `json:"walkingBike"`
	Duration                 float32     `json:"duration"`

	// Optional fields (for transit legs)
	AgencyName     string `json:"agencyName,omitempty"`
	AgencyUrl      string `json:"agencyUrl,omitempty"`
	AgencyId       string `json:"agencyId,omitempty"`
	RouteId        string `json:"routeId,omitempty"`
	RouteType      int    `json:"routeType,omitempty"`
	TripId         string `json:"tripId,omitempty"`
	ServiceDate    string `json:"serviceDate,omitempty"`
	Headsign       string `json:"headsign,omitempty"`
	RouteShortName string `json:"routeShortName,omitempty"`
	RouteLongName  string `json:"routeLongName,omitempty"`
	StopIndex      int    `json:"stopIndex,omitempty"`
	StopSequence   int    `json:"stopSequence,omitempty"`
}

type LegPoint struct {
	Name         string  `json:"name"`
	Lat          float64 `json:"lat"`
	Lon          float64 `json:"lon"`
	VertexType   string  `json:"vertexType"`
	StopId       string  `json:"stopId,omitempty"`
	Arrival      int64   `json:"arrival,omitempty"`
	Departure    int64   `json:"departure,omitempty"`
	StopIndex    int     `json:"stopIndex,omitempty"`
	StopSequence int     `json:"stopSequence,omitempty"`
}

type LegGeometry struct {
	Points string `json:"points"`
	Length int    `json:"length"`
}

type Step struct {
	Distance          float64 `json:"distance"`
	RelativeDirection string  `json:"relativeDirection"`
	StreetName        string  `json:"streetName"`
	AbsoluteDirection string  `json:"absoluteDirection"`
	StayOn            bool    `json:"stayOn"`
	Area              bool    `json:"area"`
	BogusName         bool    `json:"bogusName"`
	Lon               float64 `json:"lon"`
	Lat               float64 `json:"lat"`
	Elevation         string  `json:"elevation"`
	WalkingBike       bool    `json:"walkingBike"`
}

type Metadata struct {
	SearchWindowUsed int   `json:"searchWindowUsed"`
	NextDateTime     int64 `json:"nextDateTime"`
	PrevDateTime     int64 `json:"prevDateTime"`
}

type DebugOutput struct {
	PrecalculationTime     int                `json:"precalculationTime"`
	DirectStreetRouterTime int                `json:"directStreetRouterTime"`
	TransitRouterTime      int                `json:"transitRouterTime"`
	FilteringTime          int                `json:"filteringTime"`
	RenderingTime          int                `json:"renderingTime"`
	TotalTime              int                `json:"totalTime"`
	TransitRouterTimes     TransitRouterTimes `json:"transitRouterTimes"`
}

type TransitRouterTimes struct {
	TripPatternFilterTime int `json:"tripPatternFilterTime"`
	AccessEgressTime      int `json:"accessEgressTime"`
	RaptorSearchTime      int `json:"raptorSearchTime"`
	ItineraryCreationTime int `json:"itineraryCreationTime"`
}

type ElevationMetadata struct {
	EllipsoidToGeoidDifference float64 `json:"ellipsoidToGeoidDifference"`
	GeoidElevation             bool    `json:"geoidElevation"`
}
