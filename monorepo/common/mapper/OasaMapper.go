package mapper

import (
	"encoding/json"

	models "github.com/cs161079/monorepo/common/models"
	logger "github.com/cs161079/monorepo/common/utils/goLogger"
)

func NewOasaMapper() OasaMapper {
	return &OasaMapperImpl{}
}

type OasaMapper interface {
	GetOasaStopArrivals([]interface{}) []models.StopArrivalOasa
	GetOasaBusLocation([]interface{}) []models.BusLocation
}

type OasaMapperImpl struct {
}

func (m OasaMapperImpl) GetOasaStopArrivals(genArray []interface{}) []models.StopArrivalOasa {

	// Transform data to JSON
	byts, err := json.Marshal(genArray)
	if err != nil {
		logger.ERROR("Error on json conversation.")
		return nil
	}

	var result []models.StopArrivalOasa = make([]models.StopArrivalOasa, 0)
	err = json.Unmarshal(byts, &result)
	if err != nil {
		logger.ERROR("Error on json unmarshalling.")
		return nil
	}
	return result
}

func (m OasaMapperImpl) GetOasaBusLocation(genArray []interface{}) []models.BusLocation {
	var result []models.BusLocation = make([]models.BusLocation, 0)
	for _, rec := range genArray {
		var oasaRec models.BusLocation = models.BusLocation{}
		internalMapper(rec.(map[string]interface{}), &oasaRec)
		// var busLocation models.BusLocation = models.BusLocation{}
		// MapStruct(oasaRec, &busLocation)
		result = append(result, oasaRec)
	}
	return result
}
