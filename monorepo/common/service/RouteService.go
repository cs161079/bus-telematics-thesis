package service

import (
	"context"
	"database/sql"
	"encoding/json"

	"github.com/cs161079/monorepo/common/mapper"
	"github.com/cs161079/monorepo/common/models"
	"github.com/cs161079/monorepo/common/repository"

	"gorm.io/gorm"
)

type RouteService interface {
	WithTrx(*gorm.DB) routeService
	DeleteAll() error
	DeleteRoute01() error
	DeleteRoute02() error
	InsertArray([]models.Route) ([]models.Route, error)
	InserChunkArray(chunSize int, allData []models.Route) error
	Route02InsertArr([]models.Route02) ([]models.Route02, error)
	Route02InsertChunkArray(chunkSize int, allData []models.Route02) error
	Route01InsertArr([]models.Route01) ([]models.Route01, error)
	Route01InsertChunkArray(chunkSize int, allData []models.Route01) error
	/*
		SelectRouteByLineCode ανακτά τις διαδρομές από την βάση δεδομένων με τον
		κωδικό της γραμμής

		@param line_code
		@return
		@return error
	*/
	SelectRoutesByLineCode(int32) (*models.RouteCds, error)

	/*
		SelectFirstRouteByLinecodeWithStops επιστρέφει τον κωδικό της διαδρομής και τις στάσης ordered με το
		senu.

		@param line_code int32
		@return *models.RouteDto02
		@return error
	*/
	SelectFirstRouteByLinecodeWithStops(line_code int32) (*models.RouteDto02, error)

	SelectRouteWithStops(int32) (*models.RouteDto02, error)

	AllRoute01(context.Context) (*sql.Rows, error)

	SelectRouteDetails(int32) ([]models.Route01Dto, error)
	SelectRouteStop(int32) ([]models.StopDto03, error)
	PassengersCount(int, int) (*models.BusCapacityDt02, error)

	// ---------------- For Trip Planner -----------------
	RouteList() ([]models.RouteWithLine, error)
	RouteStopList(int32) ([]models.Route02, error)
	RouteSelect(int32) (*models.Route, error)
}

type routeService struct {
	repo        repository.RouteRepository
	repo02      repository.Route02Repository
	repo01      repository.Route01Repository
	mapper01    mapper.Route01Mapper
	routeMapper mapper.RouteMapper
}

func NewRouteService(repo repository.RouteRepository,
	repo01 repository.Route01Repository,
	repo02 repository.Route02Repository) RouteService {
	return &routeService{
		repo:        repo,
		repo02:      repo02,
		repo01:      repo01,
		mapper01:    mapper.NewRouteDetailMapper(),
		routeMapper: mapper.NewRouteMapper(),
	}
}

func (s routeService) WithTrx(trxHandle *gorm.DB) routeService {
	s.repo = s.repo.WithTx(trxHandle)
	return s
}

func (s routeService) DeleteAll() error {
	return s.repo.DeleteAll()
}

func (s routeService) DeleteRoute02() error {
	return s.repo02.DeleteRoute02()
}

func (s routeService) Route02InsertArr(entityArr []models.Route02) ([]models.Route02, error) {
	err := s.repo02.InsertRoute02Arr(entityArr)
	if err != nil {
		return nil, err
	}
	return entityArr, nil
}

func (s routeService) Route02InsertChunkArray(chunkSize int, allData []models.Route02) error {
	var stratIndex = 0
	var endIndex = chunkSize
	if chunkSize > len(allData) {
		endIndex = len(allData) - 1
	}
	for {
		_, err := s.Route02InsertArr(allData[stratIndex:endIndex])
		if err != nil {
			return err
		}
		//logger.INFO(fmt.Sprintf("Προστέθηκαν οι διαδρομές από %d έως %d.", stratIndex, endIndex-1))
		stratIndex = endIndex
		endIndex = stratIndex + chunkSize
		if stratIndex > len(allData)-1 {
			break
		} else if endIndex > len(allData)-1 {
			_, err := s.Route02InsertArr(allData[stratIndex:])
			if err != nil {
				return err
			}
			break
		}
	}
	return nil
}

func (s routeService) InsertArray(entityArr []models.Route) ([]models.Route, error) {
	return s.repo.InsertArray(entityArr)
}

func (s routeService) InserChunkArray(chunkSize int, allData []models.Route) error {
	var stratIndex = 0
	var endIndex = chunkSize
	if chunkSize > len(allData) {
		endIndex = len(allData) - 1
	}
	for {
		_, err := s.InsertArray(allData[stratIndex:endIndex])
		if err != nil {
			return err
		}
		//logger.INFO(fmt.Sprintf("Προστέθηκαν οι διαδρομές από %d έως %d.", stratIndex, endIndex-1))
		stratIndex = endIndex
		endIndex = stratIndex + chunkSize
		if stratIndex > len(allData)-1 {
			break
		} else if endIndex > len(allData)-1 {
			_, err := s.InsertArray(allData[stratIndex:])
			if err != nil {
				return err
			}
			break
		}
	}
	return nil
}

func (s routeService) Route01InsertChunkArray(chunkSize int, allData []models.Route01) error {
	var stratIndex = 0
	var endIndex = chunkSize
	if chunkSize > len(allData) {
		endIndex = len(allData) - 1
	}

	for {
		_, err := s.Route01InsertArr(allData[stratIndex:endIndex])
		if err != nil {
			return err
		}
		//logger.INFO(fmt.Sprintf("Προστέθηκαν οι λεπτομερειες διαδρομών από %d έως %d.", stratIndex, endIndex-1))
		stratIndex = endIndex
		endIndex = stratIndex + chunkSize
		if stratIndex > len(allData)-1 {

			//logger.INFO("Η εισαγωγή λεπτομερειών διαδρομών ολοκληρώθηκε.")
			break
		} else if endIndex > len(allData)-1 {
			_, err := s.Route01InsertArr(allData[stratIndex:])
			if err != nil {
				//logger.ERROR(fmt.Sprintf("Σφάλμα κατά την προσθήκη λεπτομερειών διαδρομών από %d έως τέλος.", stratIndex))
				//txt.Rollback()
				return err
			}
			break
		}
	}
	return nil
}

func Filter[T any](items []T, keep func(T) bool) []T {
	result := make([]T, 0, len(items))
	for _, item := range items {
		if keep(item) {
			result = append(result, item)
		}
	}
	return result
}

func (s routeService) SelectRoutesByLineCode(line_code int32) (*models.RouteCds, error) {
	routes, err := s.repo.SelectRouteByLineCode(line_code)
	if err != nil {
		return nil, err
	}
	// εάν δεν υπάρχουν διαδρομές για την γραμμή το σταματτάω
	if len(routes) == 0 {
		return nil, nil
	}

	mainRoutes := Filter(routes, func(u models.RouteDto01) bool {
		return u.RouteType == 1
	})
	activeRoute := routes[0].RouteCode
	if len(mainRoutes) > 0 {
		activeRoute = mainRoutes[0].RouteCode
	}

	routeWithStops, err := s.repo.SelectByRouteCodeWithStops(activeRoute)
	if err != nil {
		return nil, err
	}

	rtDto, err := s.routeMapper.RouteToRouteDto(*routeWithStops)
	if err != nil {
		return nil, err
	}

	return &models.RouteCds{
		Routes: routes,
		ActiveRoute: models.RouteDto02{
			RouteCode: activeRoute,
			Stops:     rtDto.Stops,
		},
	}, nil
}

func (s routeService) AllRoute01(ctx context.Context) (*sql.Rows, error) {
	return s.repo01.AllRecords(ctx)
}

func (s routeService) Route01InsertArr(entityArr []models.Route01) ([]models.Route01, error) {
	return s.repo01.InsertRoute01Arr(entityArr)
}

func (s routeService) DeleteRoute01() error {
	return s.repo01.Delete()
}

func (s routeService) SelectFirstRouteByLinecodeWithStops(line_code int32) (*models.RouteDto02, error) {
	origData, err := s.repo.SelectByLineCodeWithStops(line_code)
	if err != nil {
		return nil, err
	}
	dt, err := s.routeMapper.RouteToRouteDto(*origData)
	if err != nil {
		return nil, err
	}
	return &models.RouteDto02{RouteCode: dt.RouteCode, Stops: dt.Stops}, nil
}

func (s routeService) SelectRouteWithStops(routeCode int32) (*models.RouteDto02, error) {

	// Get Data from Database
	origData, err := s.repo.SelectByRouteCodeWithStops(routeCode)
	if err != nil {
		return nil, err
	}
	dt, err := s.routeMapper.RouteToRouteDto(*origData)
	if err != nil {
		return nil, err
	}
	return &models.RouteDto02{
		RouteCode: dt.RouteCode, Stops: dt.Stops,
	}, nil
}

func (s routeService) SelectRouteDetails(routeCode int32) ([]models.Route01Dto, error) {
	dt, err := s.repo01.SelectByCode(routeCode)
	if err != nil {
		return nil, err
	}
	data := s.mapper01.Route01ToDto(dt)
	return data, nil
}

func (s routeService) SelectRouteStop(routecode int32) ([]models.StopDto03, error) {
	return s.repo02.SelectRouteStops(routecode)
}

func (s routeService) PassengersCount(busID int, routeID int) (*models.BusCapacityDt02, error) {
	dbRec, err := s.repo.PassengersCount(busID, routeID)
	if err != nil {
		return nil, err
	}
	var result models.BusCapacityDt02 = models.BusCapacityDt02{}
	bts, err := json.Marshal(dbRec)
	if err != nil {
		return nil, err
	}
	json.Unmarshal(bts, &result)
	return &result, nil
}

func (s routeService) RouteList() ([]models.RouteWithLine, error) {
	return s.repo.RouteList()
}

func (s routeService) RouteStopList(routeCode int32) ([]models.Route02, error) {
	return s.repo.RouteStopList(routeCode)
}

func (s routeService) RouteSelect(routeCode int32) (*models.Route, error) {
	return s.repo.SelectByCode(routeCode)
}
