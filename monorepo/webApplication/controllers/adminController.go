package controllers

import (
	"net/http"
	"time"

	"github.com/coreos/go-oidc"
	"github.com/cs161079/monorepo/common/db"
	"github.com/cs161079/monorepo/common/models"
	"github.com/cs161079/monorepo/common/service"
	"github.com/cs161079/monorepo/common/utils"
	"github.com/cs161079/monorepo/webApplication/keycloak"
	service02 "github.com/cs161079/monorepo/webApplication/service"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AdminController interface {
	AddRouters(eng *gin.RouterGroup)
}

type adminControllerImpl struct {
	connection *gorm.DB
	ntSvc      service.NotificationService
	verifier   *oidc.IDTokenVerifier
	trafficSrv service02.TrafficService
}

func NewAdminController(dbConnection *gorm.DB, svc service.NotificationService, trafficSrv service02.TrafficService,

// verif *oidc.IDTokenVerifier
) AdminController {
	return &adminControllerImpl{
		connection: dbConnection,
		ntSvc:      svc,
		// verifier:   verif,
		trafficSrv: trafficSrv,
	}
}

func (c *adminControllerImpl) AddRouters(eng *gin.RouterGroup) {
	apiGroup := eng.Group("/admin")
	// apiGroup.Use(keycloak.AuthMiddleware(c.verifier))
	apiGroup.POST("/push", keycloak.RequireRole("oasa-admin"), c.pushNotification)
	apiGroup.GET("/jobs", c.jobList)
	apiGroup.GET("/lines/search", c.lineSearch)
	apiGroup.GET("/routes/:line_code", c.routeByLineCode)
	// Επιπλεόν endpoint για την πρόταση δρομολογίων.
	// 1) Με Queries Parameters date=YYYY-MM-DD, route_id=123
	// GET /capacity?date=YYYY-MM-DD&route_id=123
	apiGroup.GET("/capacity", c.getCapacity)

	// GET /kpis?date=YYYY-MM-DD&route_id=123&bucket_min=15&lf=0.85&peak=0.95&mult=1.0
	apiGroup.GET("/kpis", c.getKpis)

}

func (c *adminControllerImpl) getCapacity(ctx *gin.Context) {
	date := ctx.Query("date")
	route_id, err := utils.StrToInt32(ctx.Query("route_id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Route code parameter is not a valid number."})
		return
	}

	bus_id := utils.StrToInt32Def(ctx.Query("bus_id"), 0)

	searchByBusId := bus_id != 0
	var dbResults []BusCapDto = make([]BusCapDto, 0)

	dateFrom := date + " 00:00"
	dateTo := date + " 23:00"

	tx := c.connection.Table(db.BUSCAPACITY).
		Where("route_id=?", route_id).
		Where("date_time >= ?  AND date_time < ?", dateFrom,
			dateTo)
	if searchByBusId {
		tx.Where("bus_id=?", bus_id)
	}
	if err := tx.Order("route_id, date_time").
		Find(&dbResults).Error; err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// var busIdResults []interface{} = make([]interface{}, 0)
	// var finalResults []interface{} = make([]interface{}, 0)
	// var busId = dbResults[0].Bus_Id
	finalResults := make([]interface{}, 0)
	for i, _ := range dbResults {
		finalResults = append(finalResults, map[string]any{
			"x": dbResults[i].Date_Time,
			"y": dbResults[i].Bus_Pass,
		})
	}

	ctx.JSON(http.StatusOK, map[string]any{
		"route_id": route_id,
		"max":      85,
		"data":     finalResults,
	})
}

func (c *adminControllerImpl) routeByLineCode(ctx *gin.Context) {
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

func (c *adminControllerImpl) lineSearch(ctx *gin.Context) {
	var results []LineSearchDto = make([]LineSearchDto, 0)

	lnCode := ctx.Query("code")

	if lnCode != "" {
		lnCode = lnCode + "%"
		if err := c.connection.Table(db.LINETABLE).Where("line_id LIKE ?", lnCode).Find(&results).Error; err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	ctx.JSON(http.StatusOK, results)
}

func (c *adminControllerImpl) pushNotification(ctx *gin.Context) {
	var notification models.Notification
	if err := ctx.ShouldBindJSON(&notification); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := c.ntSvc.SendPushNotification(notification); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"resposne": "Notificatin Pushed Successfully!"})
}

type PaginatedResult struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"pageSize"`
	TotalPages int         `json:"totalPages"`
}

func (c *adminControllerImpl) jobList(ctx *gin.Context) {
	start := time.Now()
	var pagePtr, err = utils.StrToInt32(ctx.Query("page"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var page = int(*pagePtr)
	var pageSize = 10
	var total int64
	offset := (page - 1) * pageSize

	var recs []models.OpswCronRuns
	// Count total records
	c.connection.Model(&recs).Count(&total)

	// Fetch page data
	result := c.connection.Order("runtime DESC").Limit(pageSize).Offset(offset).Find(&recs)
	if result.Error != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": result.Error.Error()})
		return
	}

	ctx.JSON(http.StatusOK, map[string]any{"duration": time.Since(start).Seconds(), "pagingData": PaginatedResult{
		Data:       recs,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: int((total + int64(pageSize) - 1) / int64(pageSize)),
	}})
}

func (c *adminControllerImpl) getKpis(ctx *gin.Context) {
	date := ctx.Query("date")
	routeIDStr := ctx.Query("route_id")
	if date == "" || routeIDStr == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "params required: date, route_id"})
		return
	}
	routeID, err := utils.StrToInt32(routeIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "route_id must be integer"})
		return
	}

	// Optional query params (with defaults)
	bucketMin := utils.StrToInt8Def(ctx.Query("bucket_min"), 15)
	lfLowThresh := utils.StrToFloat32Def(ctx.Query("lf"), 0.85)
	lfHighThresh := utils.StrToFloat32Def(ctx.Query("hf"), 0.85)
	// peakThresh := utils.StrToFloat32Def(ctx.Query("peak"), 0.95)
	// volMult := utils.StrToFloat32Def(ctx.Query("mult"), 1.00)

	// Validations first
	if bucketMin <= 0 || bucketMin > 120 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "bucket_min must be in (1..120] minutes"})
		return
	}
	if *routeID <= 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "route_id must be > 0"})
		return
	}

	buckets, err := c.trafficSrv.GetKPIS(date, *routeID, int32(bucketMin))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Enrich με propose/reason με βάση τα thresholds
	// (εναλλακτικά, πέρασέ τα thresholds στο SQL και υπολόγισέ τα εκεί)
	for i := range buckets {
		switch {
		case buckets[i].LoadFactor >= float64(lfHighThresh):
			buckets[i].Propose = true
			buckets[i].Reason = "LFavg>=Highr threshold"
			// case buckets[i].MaxInstLF >= float64(peakThresh):
			// 	buckets[i].Propose = true
			// 	buckets[i].Reason = "LFpeak>=threshold"
			buckets[i].Action = "Add"
		case buckets[i].LoadFactor <= float64(lfLowThresh):
			buckets[i].Propose = true
			buckets[i].Reason = "LFavg<=Low threshold"
			buckets[i].Action = "Reduce"
		}

	}
	ctx.JSON(http.StatusOK, buckets)
}
