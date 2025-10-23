package models

import "github.com/cs161079/monorepo/common/db"

// ********* Struct for matching Stops per Route **************
// ****************** Database Entity *************************
// type Route02 struct {
// 	RouteCode   int32 `json:"routeCode" gorm:"column:rt_code;primaryKey"`
// 	Stp_code int32 `json:"stp_code" gorm:"primaryKey"`
// 	Senu     int16 `json:"senu" gorm:"primaryKey"`
// 	Stop     Stop  `json:"stop" gorm:"foreignKey:Stop_code"`
// }

type Route02 struct {
	RtCode  int32 `json:"routeCode" gorm:"column:rt_code;primaryKey"` // FK to route.route_code
	StpCode int32 `json:"stp_code" gorm:"column:stp_code;primaryKey"` // FK to stop.stop_code
	Senu    int16 `json:"senu" gorm:"column:senu;primaryKey"`

	Route Route `json:"route" gorm:"foreignKey:RtCode;references:RouteCode"`
	Stop  Stop  `json:"stop" gorm:"foreignKey:StpCode;references:StopCode"`
}

func (Route02) TableName() string {
	return db.ROUTESTOPSTABLE
}
