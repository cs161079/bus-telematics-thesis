package service

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/cs161079/monorepo/webApplication/models"
)

type OtpService interface {
	tripPlanerRequest(models.CustomPoint, models.CustomPoint) (any, error)
	TripPlan(models.CustomPoint, models.CustomPoint) ([]models.Trip, error)
}

type OtpServiceImplementation struct {
	otpService string
}

func NewOtpService() OtpService {
	otp_service := os.Getenv("otp.service")
	if otp_service == "" {
		panic("Enviroment does not provide OTP URL service.")
	}
	return &OtpServiceImplementation{
		otpService: otp_service,
	}
}

func (s *OtpServiceImplementation) tripPlanerRequest(from models.CustomPoint, to models.CustomPoint) (any, error) {
	client := &http.Client{}

	req, err := http.NewRequest("GET",
		fmt.Sprintf("%s/otp/routers/default/plan?fromPlace=%f,%f&toPlace=%f,%f&mode=TRANSIT,WALK",
			s.otpService, from.Lat, from.Lng, to.Lat, to.Lng), nil)
	if err != nil {
		return nil, err
	}

	resp, err := client.Do(req)
	if err != nil {
		log.Fatal(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println("Response:", string(body))
	var tripResponse models.OTPResponse
	json.Unmarshal(body, &tripResponse)
	return tripResponse, nil
}

func (s *OtpServiceImplementation) TripPlan(from models.CustomPoint, to models.CustomPoint) ([]models.Trip, error) {
	var otpDataInterface, err = s.tripPlanerRequest(from, to)
	if err != nil {
		return nil, err
	}

	var otpData models.OTPResponse = otpDataInterface.(models.OTPResponse)
	var tripsResult []models.Trip = make([]models.Trip, 0)
	for _, rec := range otpData.Plan.Itineraries {
		var curTrip = models.Trip{
			Duration:     rec.Duration,
			StartTime:    rec.StartTime,
			EndTime:      rec.EndTime,
			WalkTime:     rec.WalkTime,
			TransitTime:  rec.TransitTime,
			WalkDistance: rec.WalkDistance,
		}

		curTrip.Parts = make([]models.Part, 0)

		for _, rec01 := range rec.Legs {
			var curPart = models.Part{
				StartTime:      rec01.StartTime,
				EndTime:        rec01.EndTime,
				Distance:       rec01.Distance,
				Mode:           rec01.Mode,
				Duration:       rec01.Duration,
				AgencyName:     rec01.AgencyName,
				Route:          rec01.Route,
				RouteShortName: rec01.RouteShortName,
				RouteLongName:  rec01.RouteLongName,
				From:           rec01.From,
				To:             rec01.To,
				Steps:          rec01.Steps,
				LegGeometry:    rec01.LegGeometry,
			}
			curTrip.Parts = append(curTrip.Parts, curPart)
		}
		tripsResult = append(tripsResult, curTrip)

	}
	return tripsResult, nil
}
