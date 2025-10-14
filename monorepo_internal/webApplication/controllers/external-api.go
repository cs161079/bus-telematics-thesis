package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/cs161079/monorepo/common/db"
	"github.com/cs161079/monorepo/common/models"
	"github.com/cs161079/monorepo/common/service"
	"github.com/cs161079/monorepo/common/utils"
	logger "github.com/cs161079/monorepo/common/utils/goLogger"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ExtApiController interface {
	AddRouters(eng *gin.RouterGroup)
	busCapacity(*gin.Context)
}

type extApiControllerImpl struct {
	connection    *gorm.DB
	busSrv        service.BusService
	routeSrv      service.RouteService
	scheduleSrv   service.ScheduleService
	schedule01Srv service.Schedule01Service
}

func NewExtApiController(dbConnection *gorm.DB, routeSrv service.RouteService, busSrv service.BusService,
	schedulSrv service.ScheduleService, schedule01Srv service.Schedule01Service) ExtApiController {
	return &extApiControllerImpl{
		connection:    dbConnection,
		busSrv:        busSrv,
		routeSrv:      routeSrv,
		scheduleSrv:   schedulSrv,
		schedule01Srv: schedule01Srv,
	}
}

func (c *extApiControllerImpl) AddRouters(eng *gin.RouterGroup) {
	apiGroup := eng.Group("/ext")
	apiGroup.GET("/routes/:line_code", c.routeByLineCode)
	apiGroup.GET("/stops/:route_code", c.getRouteDtls)
	apiGroup.GET("/schedule/:line_code/:direction", c.getSchedule)
	apiGroup.POST("/capacity/:route_code/:bus_id", c.busCapacity)
}

func (c *extApiControllerImpl) busCapacity(ctx *gin.Context) {
	busID, err := utils.StrToInt64(ctx.Param("bus_id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	route_code, err := utils.StrToInt32(ctx.Param(("route_code")))
	if err != nil {
		ctx.JSON(http.StatusBadRequest,
			gin.H{"error": fmt.Sprintf("Route code is not a valid. [%s]", ctx.Param("route_code"))})
		return
	}

	var req BusCapacityRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.INFO(fmt.Sprintf("Insert Capacity for Bus %d in Route %d", *busID, req.Capacity))

	// If the input is local Athens time without zone info:
	loc, _ := time.LoadLocation("Europe/Athens")
	tLocal, _ := time.ParseInLocation("2006-01-02T15:04:05Z", req.Time, loc)

	// Option A: store UTC (recommended if column is TIMESTAMP)
	var inputData models.BusCapacityDto = models.BusCapacityDto{
		Bus_Cap:     req.Capacity,
		Passengers:  req.Passengers,
		Date_modify: tLocal.UTC(),
		Bus_Id:      *busID,
		Route_Id:    *route_code,
	}

	returnedData, err := c.busSrv.SaveBusCapacityTest(inputData)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}

	// Business logic here...
	ctx.JSON(http.StatusCreated, gin.H{
		"message": fmt.Sprintf("Bus with [ID: %d] capacity updated!", returnedData.Bus_Id),
	})
}

func (c *extApiControllerImpl) getRouteDtls(ctx *gin.Context) {
	routeCode, err := utils.StrToInt32(ctx.Param("route_code"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	route, err := c.routeSrv.RouteSelect(*routeCode)
	if err != nil {
		logger.ERROR(err.Error())
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, map[string]any{"error": "Internal Server Error"})
		return
	}
	stops, err := c.routeSrv.SelectRouteStop(*routeCode)
	if err != nil {
		logger.ERROR(err.Error())
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, map[string]any{"error": "Internal Server Error"})
		return
	}

	ctx.JSON(http.StatusOK, map[string]any{"code": route.RouteCode, "descr": route.RouteDescr, "stops": stops})

}

func (c *extApiControllerImpl) getSchedule(ctx *gin.Context) {
	line_code, err := utils.StrToInt32(ctx.Param("line_code"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	direction, err := utils.StrToInt8(ctx.Param("direction"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	scheduleRecs, err := c.scheduleSrv.ScheduleTimeListByLineCode(*line_code, int(*direction))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Internal Error on Database query for Master Schedule."})
	}

	selectedSdc := -1
	currentMonth := time.Now().Month()
	currentDay := time.Now().Weekday()
	for _, rec := range scheduleRecs {
		if (rec.SDCMonths[currentMonth-1] == '1') && (rec.SDCDays[currentDay] == '1') {
			selectedSdc = rec.SDCCd
			break
		}
	}

	scheduleTimes, err := c.schedule01Srv.ScheduleTimeList(int(*line_code), selectedSdc, int(*direction))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Internal Error on Database query for Schedule Times."})
	}

	ctx.JSON(http.StatusOK, scheduleTimes)
}

func (c *extApiControllerImpl) routeByLineCode(ctx *gin.Context) {
	var results []RouteOptsDto = make([]RouteOptsDto, 0)

	lineCodeStr := ctx.Param("line_code")
	lineCode, err := utils.StrToInt32(lineCodeStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Line code parameter is not valid number."})
		return
	}

	if err := c.connection.Table(db.ROUTETABLE).Where("ln_code = ?", lineCode).Find(&results).Error; err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, results)
}

type TimeDto01 time.Time
type BusCapacityRequest struct {
	Capacity   int32  `json:"capacity"`
	Passengers int32  `json:"passengers"`
	Time       string `json:"time"`
	SdcCode    int32  `json:"sdc_code"`
	StartTime  string `json:"start_time"`
}

func (d TimeDto01) UnmarshalJSON() ([]byte, error) {
	// Use a custom format for JSON serialization
	ttime := time.Time(d)
	var dateStr = "null"
	if !ttime.IsZero() {
		dateStr = ttime.Format("2006-01-02T15:04:05Z")
	}
	return json.Marshal(dateStr)
}

type LineExtDto struct {
	MLCode       int    `json:"ml_code"`
	SDCCode      int    `json:"sdc_code"`
	LineCode     int    `json:"line_code"`
	LineID       string `json:"line_id"`
	LineDescr    string `json:"line_descr"`
	LineDescrEng string `json:"line_descr_eng"`
	MldMaster    int16  `json:"mld_master"`
	LineType     int8   `json:"line_type"`
}

type LineSearchDto struct {
	LineCode  int    `json:"id"`
	LineId    string `json:"code"`
	LineDescr string `json:"descr"`
}

type RouteOptsDto struct {
	RouteCode  int32  `json:"code"`
	RouteDescr string `json:"descr"`
	RouteType  int    `json:"route_type"`
}

type BusCapDto struct {
	Bus_Id    int64         `json:"bus_id"`
	Route_Id  int32         `json:"route_id"`
	Bus_Cap   int32         `json:"bus_cap"`
	Bus_Pass  int32         `json:"bus_pass"`
	Date_Time CustomeTime01 `json:"date_time"`
}

type CustomeTime01 time.Time

func (d CustomeTime01) MarshalJSON() ([]byte, error) {
	// Use a custom format for JSON serialization
	ttime := time.Time(d)
	var dateStr = "null"
	if !ttime.IsZero() {
		dateStr = ttime.Format("15:04:05")
	}
	return json.Marshal(dateStr)
}
