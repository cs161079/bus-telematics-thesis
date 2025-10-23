package controllers

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/cs161079/monorepo/common/db"
	"github.com/cs161079/monorepo/common/models"
	"github.com/cs161079/monorepo/common/service"
	"github.com/cs161079/monorepo/common/utils"
	webModels "github.com/cs161079/monorepo/webApplication/models"
	mainService "github.com/cs161079/monorepo/webApplication/service"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type MobileController interface {
	AddRouters(eng *gin.RouterGroup)
	planTrip(ctx *gin.Context)
	getStopArrivals(ctx *gin.Context)
}

type MobileControllerImplementation struct {
	connection  *gorm.DB
	otp_service mainService.OtpService
	lineSvc     service.LineService
	routeSvc    service.RouteService
	schedSvc    service.ScheduleService
	stopSrv     service.StopService
	oasaSrv     service.OasaService
}

func NewMobileController(connection *gorm.DB, otpSrv mainService.OtpService, lineSvc service.LineService,
	routeSvc service.RouteService, schedSvc service.ScheduleService, stopSrv service.StopService, oasaSrv service.OasaService) MobileController {
	return &MobileControllerImplementation{
		connection:  connection,
		otp_service: otpSrv,
		lineSvc:     lineSvc,
		routeSvc:    routeSvc,
		schedSvc:    schedSvc,
		stopSrv:     stopSrv,
		oasaSrv:     oasaSrv,
	}
}

func (c *MobileControllerImplementation) AddRouters(eng *gin.RouterGroup) {
	apiGroup := eng.Group("/otp")
	apiGroup.POST("/plan", c.planTrip)

	lineGroup := eng.Group("/lines")
	lineGroup.GET("/list", c.getLineList)
	lineGroup.GET("/details", c.getLineInfo)
	lineGroup.GET("/search", c.searchLine)
	lineGroup.GET("/alt/list", c.alternativeLines)
	lineGroup.GET("/cbs", c.lineCombos)

	routeGroup := eng.Group("/routes")
	routeGroup.GET("/stops", c.stopListByRouteCode)
	routeGroup.GET("/details", c.routeDetails)
	// routeGroup.GET("/capacity", c.busCapacity)

	stopGrp := eng.Group("/stop")
	stopGrp.GET("/info", c.getStopInfo)
	stopGrp.GET("/closeStops", c.closeStops)

	scheduleGroup := eng.Group("/schedule")
	scheduleGroup.GET("/details", c.getSchedule)

	oasaGrp := eng.Group("/oasa")
	oasaGrp.GET("/arrival", c.getStopArrivals)
	oasaGrp.GET("/busLocation", c.getBusLocation)

}

func (c *MobileControllerImplementation) getSchedule(ctx *gin.Context) {
	start := time.Now()
	sdcCodeQuery := ctx.Query("sdc_code")
	if sdcCodeQuery == "" {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]any{"error": "Query Parameter Schedule code is not provided."})
		return
	}
	sdc_code, err := utils.StrToInt32(sdcCodeQuery)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]any{"error": "Query Parameter Schedule code is not a valid number."})
		return
	}
	lnCodeQuery := ctx.Query("line_code")
	if lnCodeQuery == "" {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]any{"error": "Query Parameter Line code is not provided."})
		return
	}
	line_code, err := utils.StrToInt32(lnCodeQuery)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]any{"error": "Query Parameter Line code is not a valid number."})
		return
	}

	schedule, err := c.schedSvc.SelectByLineSdcCodeWithTimes(*line_code, *sdc_code)
	if err != nil {
		// ctx.AbortWithStatusJSON(http.StatusOK, map[string]any{"error": err.Error(), "code": "err-001"})
		models.HttpResponse(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, map[string]any{"duration": time.Since(start).Seconds(), "data": schedule})
}

func (c *MobileControllerImplementation) routeDetails(ctx *gin.Context) {
	start := time.Now()
	route_code, err := utils.StrToInt32(ctx.Query("code"))
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]any{"error": "Query Parameter code is not a valid number."})
		return
	}

	data, err := c.routeSvc.SelectRouteDetails(*route_code)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}

	stops, err := c.routeSvc.SelectRouteStop(*route_code)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, map[string]any{"duration": time.Since(start).Seconds(), "data": map[string]any{
		"details": data,
		"stops":   stops,
	}})
}

func (c *MobileControllerImplementation) busCapacity(ctx *gin.Context) {

}

func (c *MobileControllerImplementation) stopListByRouteCode(ctx *gin.Context) {
	start := time.Now()
	route_code, err := utils.StrToInt32(ctx.Query("code"))
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]any{"error": "Query Parameter code is not a valid number."})
		return
	}

	var rt models.RouteDto
	data, err := c.routeSvc.SelectRouteWithStops(*route_code)
	if err != nil {
		// ctx.AbortWithStatusJSON(http.StatusOK, map[string]any{"error": err.Error(), "code": "err-001"})
		models.HttpResponse(ctx, err)
		return
	}
	rt = *data

	ctx.JSON(http.StatusOK, map[string]any{"duration": time.Since(start).Seconds(), "data": rt})
}

func (c *MobileControllerImplementation) searchLine(ctx *gin.Context) {
	start := time.Now()
	searchText := ctx.Query("text")

	result, err := c.lineSvc.SearchLine(searchText)

	if err != nil {
		//ctx.AbortWithStatusJSON(http.StatusOK, map[string]any{"error": err.Error(), "code": "err-001"})
		models.HttpResponse(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, map[string]any{"duration": time.Since(start).Seconds(), "data": result})

}

func (c *MobileControllerImplementation) getLineInfo(ctx *gin.Context) {
	start := time.Now()
	line_code, err := utils.StrToInt32(ctx.Query("code"))
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]any{"error": "Query Parameter code is not a valid number."})
		return
	}

	var line *models.LineDto
	line, err = c.lineSvc.SelectByLineCode(*line_code)
	if err != nil {
		models.HttpResponse(ctx, err)
		return
	}

	var route *models.RouteDto
	route, err = c.routeSvc.SelectFirstRouteByLinecodeWithStops(*line_code)

	if err != nil {
		// ctx.AbortWithStatusJSON(http.StatusOK, map[string]any{"error": err.Error(), "code": "err-001"})
		models.HttpResponse(ctx, err)
		return
	}

	line.Route = *route

	var schedule *models.ScheduleMaster

	schedule, err = c.schedSvc.SelectByLineSdcCodeWithTimes(line.Line_Code, line.Sdc_Cd)
	if err != nil {
		//ctx.AbortWithStatusJSON(http.StatusOK, map[string]any{"error": err.Error(), "code": "err-001"})
		models.HttpResponse(ctx, err)
		return
	}
	line.Schedule = *schedule

	ctx.JSON(http.StatusOK, map[string]any{"duration": time.Since(start).Seconds(), "data": line})
}

func (c *MobileControllerImplementation) getLineList(ctx *gin.Context) {
	data, err := c.lineSvc.GetLineList()
	if err != nil {
		ctx.Error(err)
		return
	}
	ctx.JSON(http.StatusOK, map[string]any{
		"lines": data,
	})
}

func (c *MobileControllerImplementation) planTrip(ctx *gin.Context) {
	start := time.Now()
	body, err := io.ReadAll(ctx.Request.Body)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]interface{}{
			"error":   true,
			"message": "Error on read Request body",
		})
	}

	var structedBody map[string]interface{}
	err = json.Unmarshal(body, &structedBody)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]interface{}{
			"error":   true,
			"message": "Πρόβλημα κατά την μετατροπή του JSON.",
		})
	}
	fromJson, err := json.Marshal(structedBody["from"])
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]interface{}{
			"error":   true,
			"message": "Σφάλμα κατά την αίτηση για δημιουργία διαδρομής.",
		})
	}
	var from webModels.CustomPoint
	err = json.Unmarshal(fromJson, &from)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]interface{}{
			"error":   true,
			"message": "Σφάλμα κατά την αίτηση για δημιουργία διαδρομής.",
		})
	}

	toJson, err := json.Marshal(structedBody["to"])
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]interface{}{
			"error":   true,
			"message": "Σφάλμα κατά την αίτηση για δημιουργία διαδρομής.",
		})
	}
	var to webModels.CustomPoint
	err = json.Unmarshal(toJson, &to)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]interface{}{
			"error":   true,
			"message": "Σφάλμα κατά την αίτηση για δημιουργία διαδρομής.",
		})
	}

	result, err := c.otp_service.TripPlan(from, to)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]interface{}{
			"error":   true,
			"message": "Σφάλμα κατά την αίτηση για δημιουργία διαδρομής.",
		})
	}

	ctx.JSON(http.StatusOK, map[string]interface{}{
		"duration": time.Since(start).Seconds(),
		"data":     result,
	})

}

func (c *MobileControllerImplementation) GetStopInfo(ctx *gin.Context) {
	start := time.Now()
	stopCodeParam := ctx.Query("code")
	stop_code, err := utils.StrToInt32(stopCodeParam)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]any{"error": "Query Parameter Stop code is not a valid number."})
		return
	}
	stopInfo, err := c.stopSrv.SelectByCode(*stop_code)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, map[string]any{"duration": time.Since(start).Seconds(), "data": *stopInfo})
}

func (c *MobileControllerImplementation) getStopArrivals(ctx *gin.Context) {
	start := time.Now()
	stop_codeParam := ctx.Query("code")
	stop_code, err := utils.StrToInt32(stop_codeParam)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]any{"error": "Query Parameter code is not a valid number."})
		return
	}

	structedResponse, err := c.oasaSrv.GetBusArrival(*stop_code)

	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, map[string]any{"duration": time.Since(start).Seconds(), "data": structedResponse})
}

func (c *MobileControllerImplementation) getBusLocation(ctx *gin.Context) {
	start := time.Now()
	route_codeParam := ctx.Query("code")
	route_code, err := utils.StrToInt32(route_codeParam)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]any{"error": "Query Parameter code is not a valid number."})
		return
	}

	structedResponse, err := c.oasaSrv.GetBusLocation(*route_code)

	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, map[string]any{"duration": time.Since(start).Seconds(), "data": structedResponse})
}

func (c *MobileControllerImplementation) closeStops(ctx *gin.Context) {
	start := time.Now()
	latParam := ctx.Query("lat")
	lngParam := ctx.Query("lng")
	lat := utils.StrToFloat(latParam)
	lng := utils.StrToFloat(lngParam)

	closeStops, err := c.stopSrv.SelectClosestStops02(lat, lng)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, map[string]any{"stops": closeStops, "duration": time.Since(start).Seconds()})
}

func (c *MobileControllerImplementation) getStopInfo(ctx *gin.Context) {
	start := time.Now()
	stopCodeParam := ctx.Query("code")
	stop_code, err := utils.StrToInt32(stopCodeParam)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]any{"error": "Query Parameter Stop code is not a valid number."})
		return
	}
	stopInfo, err := c.stopSrv.SelectByCode(*stop_code)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, map[string]any{"duration": time.Since(start).Seconds(), "data": *stopInfo})
}

func (t *MobileControllerImplementation) alternativeLines(ctx *gin.Context) {
	start := time.Now()
	line_id := ctx.Query("line_id")
	if line_id == "" {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]any{"error": "Query Parameter Master line code is not a valid number."})
		return
	}

	comboRec, err := t.lineSvc.AlternativeLinesList(line_id)
	if err != nil {
		models.HttpResponse(ctx, err)
		return
	}
	var response map[string]interface{} = map[string]interface{}{"altLines": comboRec}
	ctx.JSON(http.StatusOK, map[string]any{"duration": time.Since(start).Seconds(), "data": response})
}

func (t *MobileControllerImplementation) lineCombos(ctx *gin.Context) {
	start := time.Now()
	var code = ctx.Query("code")
	if code == "" {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, map[string]any{"error": "Line code must have a value."})
		return
	}
	lineCode, err := utils.StrToInt32(code)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusOK, map[string]any{"error": fmt.Sprintf("Parameter code must be a valid number [value=%s]!", code), "code": "err-001"})
	}

	var routesCb []models.ComboRec
	dbResult := t.connection.Table(db.ROUTETABLE).Select("route_code as code, route_descr as descr").Where("ln_code=?", *lineCode).Find(&routesCb)
	if dbResult.RowsAffected == 0 {
		dbResult.Error = gorm.ErrRecordNotFound
	}
	if dbResult.Error != nil {
		if errors.Is(dbResult.Error, gorm.ErrRecordNotFound) {
			ctx.AbortWithStatusJSON(http.StatusNotFound, map[string]any{"error": fmt.Sprintf("No route were found for Line with code=%d!", *lineCode), "code": "err-001"})
			return
		} else {
			panic(fmt.Sprintln("Database Error ", dbResult.Error.Error()))
		}
	}

	var sdcCb []models.ComboRec
	dbResult = t.connection.Table(db.SCHEDULEMASTERTABLE).Distinct("schedulemaster.sdc_code as code, schedulemaster.sdc_descr as descr").
		Joins("LEFT JOIN "+db.SCHEDULETIMETABLE+" ON schedulemaster.sdc_code=scheduletime.sdc_cd").Where("scheduletime.ln_code=?", *lineCode).Find(&sdcCb)
	// if dbResult.RowsAffected == 0 {
	// 	dbResult.Error = gorm.ErrRecordNotFound
	// }
	if dbResult.Error != nil {
		if errors.Is(dbResult.Error, gorm.ErrRecordNotFound) {
			ctx.AbortWithStatusJSON(http.StatusOK, map[string]any{"error": fmt.Sprintf("No scheduled routes were found for Line with code=%d!", *lineCode), "code": "err-001"})
			return
		} else {
			panic(fmt.Sprintln("Database Error ", dbResult.Error.Error()))
		}
	}
	var response map[string]interface{} = map[string]interface{}{"routesCb": routesCb, "sdcCb": sdcCb}
	ctx.JSON(http.StatusOK, map[string]any{"duration": time.Since(start).Seconds(), "data": response})
}
