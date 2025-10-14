package mapper

import models "github.com/cs161079/monorepo/common/models"

type Route01Mapper interface {
	Route01ToDto(source []models.Route01) []models.Route01Dto
}

type route01Mapper struct {
}

func NewRouteDetailMapper() Route01Mapper {
	return &route01Mapper{}
}

func (m route01Mapper) Route01ToDto(source []models.Route01) []models.Route01Dto {
	var result []models.Route01Dto
	MapStruct(source, &result)
	return result
}
