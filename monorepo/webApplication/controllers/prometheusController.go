package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	reqs = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total HTTP requests.",
		},
		[]string{"path", "method", "code"},
	)
	latency = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "Duration of HTTP requests.",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"path", "method", "code"},
	)
	reg = prometheus.NewRegistry()
)

func promMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next() // process request

		// Prefer the ROUTE template to avoid high cardinality.
		path := c.FullPath()
		if path == "" {
			path = c.Request.URL.Path
		}
		method := c.Request.Method
		code := strconv.Itoa(c.Writer.Status())

		reqs.WithLabelValues(path, method, code).Inc()
		latency.WithLabelValues(path, method, code).Observe(time.Since(start).Seconds())
	}
}

func toStatus(code int) string {
	// You can return strconv.Itoa(code) if you prefer numeric codes.
	// Strings are fine; just be consistent across metrics.
	switch {
	case code >= 100 && code < 200:
		return "1xx"
	case code >= 200 && code < 300:
		return "2xx"
	case code >= 300 && code < 400:
		return "3xx"
	case code >= 400 && code < 500:
		return "4xx"
	default:
		return "5xx"
	}
}

type PrometheusController interface {
	AddRouters(eng *gin.RouterGroup)
	Status(c *gin.Context)
}

type prometheusController struct {
}

func NewPrometheusController() PrometheusController {
	return &prometheusController{}
}

func (u prometheusController) AddRouters(eng *gin.RouterGroup) {
	// Register collectors
	reg.MustRegister(reqs, latency)
	reg.MustRegister(
		collectors.NewGoCollector(),
		collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}),
	)

	eng.GET("/metrics", gin.WrapH(promhttp.HandlerFor(reg, promhttp.HandlerOpts{})))
	eng.GET("/health", u.Status)
	eng.Use(promMiddleware())
}

func (u prometheusController) Status(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"Status": "ok",
	})
}
