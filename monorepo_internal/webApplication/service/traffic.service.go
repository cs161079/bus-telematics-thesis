package service

import (
	"gorm.io/gorm"
)

// type KPIBucket struct {
// 	SlotStart   string  `json:"slot_start"` // HH:MM:SS
// 	SlotEnd     string  `json:"slot_end"`   // HH:MM:SS
// 	PassSum     float64 `json:"pass_sum"`
// 	CapSum      int     `json:"cap_sum"`
// 	LoadFactor  float64 `json:"load_factor"` // pass_sum / cap_sum (0..n)
// 	MaxInstLF   float64 `json:"max_inst_lf"` // max(bus_pass/bus_cap)
// 	Propose     bool    `json:"propose"`     // true if any rule hits
// 	Reason      string  `json:"reason"`      // which rule triggered
// 	BucketMin   int     `json:"bucket_min"`
// 	ServiceDate string  `json:"service_date"` // YYYY-MM-DD
// 	RouteID     int     `json:"route_id"`
// }

type KPIBucket struct {
	RouteID     int     `json:"route_id"`
	ServiceDate string  `json:"service_date"`
	SlotStart   string  `json:"slot_start"`
	SlotEnd     string  `json:"slot_end"`
	CapSum      int     `json:"cap_sum"`
	PassSum     float64 `json:"pass_sum"`
	LoadFactor  float64 `json:"load_factor"`
	// MaxInstLF   float64 `json:"max_inst_lf"`
	Propose bool   `json:"propose"`
	Reason  string `json:"reason"`
	Action  string `json:"action"`
}

type TrafficService interface {
	GetKPIS(date string, routeID int32, bucketMin int32) ([]KPIBucket, error)
}

type TrafficServiceImplementation struct {
	dbConnection *gorm.DB
}

func NewTrafficService(connection *gorm.DB) TrafficService {
	return &TrafficServiceImplementation{
		dbConnection: connection,
	}
}

func (s *TrafficServiceImplementation) GetKPIS(date string, routeID int32, bucketMin int32) ([]KPIBucket, error) {
	// MySQL aggregation by bucket using FLOOR(TIME_TO_SEC)/bucket
	// We duplicate the bucket parameter where needed, MySQL doesn’t allow using alias in GROUP BY
	// q := `
	// 	WITH base AS (
	// 	SELECT route_id, DATE(date_time) AS svc_date, TIME(date_time) AS tod, bus_cap, bus_pass
	// 	FROM bus_capacity
	// 	WHERE DATE(date_time) = ? AND route_id = ?
	// 	),
	// 	buckets AS (
	// 	SELECT
	// 		SEC_TO_TIME(FLOOR(TIME_TO_SEC(tod)/( ? *60))*( ? *60))                AS slot_start,
	// 		SEC_TO_TIME(FLOOR(TIME_TO_SEC(tod)/( ? *60))*( ? *60) + (?*60))       AS slot_end,
	// 		SUM(bus_pass)                                                          AS pass_sum,
	// 		SUM(bus_cap)                                                           AS cap_sum,
	// 		MAX(CASE WHEN bus_cap>0 THEN bus_pass/bus_cap ELSE 0 END)             AS max_inst_lf,
	// 		CASE WHEN SUM(bus_cap)=0 THEN 0 ELSE SUM(bus_pass)/SUM(bus_cap) END   AS load_factor
	// 	FROM base
	// 	GROUP BY slot_start, slot_end
	// 	)
	// 	SELECT slot_start, slot_end, pass_sum, cap_sum, load_factor, max_inst_lf
	// 	FROM buckets
	// 	ORDER BY slot_start`
	// q := `WITH base AS (
	// 	SELECT
	// 		route_id, bus_id,
	// 		DATE(date_time) AS svc_date,
	// 		TIME(date_time) AS tod,
	// 		bus_cap, bus_pass
	// 	FROM bus_capacity
	// 	WHERE DATE(date_time) = ? AND route_id = ?
	// 	),
	// 	tagged AS (
	// 	SELECT
	// 		route_id, bus_id, svc_date, tod, bus_cap, bus_pass,
	// 		SEC_TO_TIME(FLOOR(TIME_TO_SEC(tod)/( ? *60))*( ? *60))                  AS slot_start,
	// 		SEC_TO_TIME(FLOOR(TIME_TO_SEC(tod)/( ? *60))*( ? *60) + (?*60))         AS slot_end,
	// 		SEC_TO_TIME(FLOOR(TIME_TO_SEC(tod)/ ? )* ? )                             AS grain
	// 	FROM base
	// 	),
	// 	per_bus_bucket AS (
	// 	SELECT
	// 		route_id, svc_date, bus_id, slot_start, slot_end,
	// 		AVG(bus_pass) AS pass_avg_bus,
	// 		MAX(bus_cap)  AS cap_bus
	// 	FROM tagged
	// 	GROUP BY route_id, svc_date, bus_id, slot_start, slot_end
	// 	),
	// 	per_bus_grain AS (
	// 	SELECT
	// 		route_id, svc_date, slot_start, slot_end, grain, bus_id,
	// 		AVG(bus_pass) AS pass_avg_bus_grain,
	// 		MAX(bus_cap)  AS cap_bus
	// 	FROM tagged
	// 	GROUP BY route_id, svc_date, slot_start, slot_end, grain, bus_id
	// 	),
	// 	sum_per_grain AS (
	// 	SELECT
	// 		route_id, svc_date, slot_start, slot_end, grain,
	// 		SUM(pass_avg_bus_grain) AS pass_sum_grain,
	// 		SUM(cap_bus)            AS cap_sum_grain
	// 	FROM per_bus_grain
	// 	GROUP BY route_id, svc_date, slot_start, slot_end, grain
	// 	),
	// 	peak_per_slot AS (
	// 	SELECT
	// 		route_id, svc_date, slot_start, slot_end,
	// 		MAX(CASE WHEN cap_sum_grain=0 THEN 0
	// 				ELSE pass_sum_grain / cap_sum_grain END) AS max_inst_lf
	// 	FROM sum_per_grain
	// 	GROUP BY route_id, svc_date, slot_start, slot_end
	// 	),
	// 	avg_per_slot AS (
	// 	SELECT
	// 		route_id, svc_date, slot_start, slot_end,
	// 		SUM(cap_bus)      AS cap_sum,
	// 		SUM(pass_avg_bus) AS pass_sum
	// 	FROM per_bus_bucket
	// 	GROUP BY route_id, svc_date, slot_start, slot_end
	// 	)
	// 	SELECT
	// 	a.route_id,
	// 	a.svc_date,
	// 	a.slot_start,
	// 	a.slot_end,
	// 	a.cap_sum,
	// 	a.pass_sum,
	// 	CASE WHEN a.cap_sum=0 THEN 0 ELSE a.pass_sum / a.cap_sum END AS load_factor,
	// 	p.max_inst_lf
	// 	FROM avg_per_slot a
	// 	JOIN peak_per_slot p
	// 	ON p.route_id=a.route_id AND p.svc_date=a.svc_date
	// 	AND p.slot_start=a.slot_start AND p.slot_end=a.slot_end
	// 	ORDER BY a.slot_start;`

	q := `WITH base AS (
		SELECT
			route_id,
			bus_id,
			DATE(date_time) AS svc_date,
			TIME(date_time) AS tod,
			bus_cap,
			bus_pass
		FROM bus_capacity
		WHERE DATE(date_time) = ? AND route_id = ?
		),

		-- Βήμα 1: μέσος όρος επιβατών ανά λεωφορείο & slot
		per_bus_slot AS (
		SELECT
			route_id,
			svc_date,
			bus_id,
			SEC_TO_TIME(FLOOR(TIME_TO_SEC(tod)/( ? *60))*( ? *60))          AS slot_start,
			SEC_TO_TIME(FLOOR(TIME_TO_SEC(tod)/( ? *60))*( ? *60) + (?*60)) AS slot_end,
			AVG(bus_pass) AS avg_pass_bus,
			MAX(bus_cap)  AS cap_bus
		FROM base
		GROUP BY route_id, svc_date, bus_id, slot_start, slot_end
		),

		-- Βήμα 2: σύνοψη ανά slot (άθροισμα bus)
		agg AS (
		SELECT
			route_id,
			svc_date,
			slot_start,
			slot_end,
			SUM(cap_bus)      AS cap_sum,     -- συνολική χωρητικότητα όλων των λεωφορείων
			SUM(avg_pass_bus) AS pass_sum     -- συνολικοί επιβάτες (άθροισμα μέσων ανά bus)
		FROM per_bus_slot
		GROUP BY route_id, svc_date, slot_start, slot_end
		)

		-- Βήμα 3: load factor ανά slot
		SELECT
		route_id,
		svc_date,
		slot_start,
		slot_end,
		cap_sum,
		pass_sum,
		CASE WHEN cap_sum = 0 THEN 0 ELSE pass_sum / cap_sum END AS load_factor
		FROM agg
		ORDER BY slot_start;`

	res := []KPIBucket{}
	err := s.dbConnection.Raw(q, date, routeID, bucketMin, bucketMin, bucketMin, bucketMin, bucketMin).Scan(&res).Error
	if err != nil {
		return nil, err
	}

	return res, nil
}
