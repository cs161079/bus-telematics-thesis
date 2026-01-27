package repository

import (
	"fmt"

	"github.com/cs161079/monorepo/common/db"
	"github.com/cs161079/monorepo/common/models"
	logger "github.com/cs161079/monorepo/common/utils/goLogger"

	"gorm.io/gorm"
)

type ScheduleRepository interface {
	WithTx(tx *gorm.DB) scheduleRepository
	DeleteAll() error
	SelectBySdcCodeLineCode(iLine int64, iSdc int32) (*models.ScheduleMaster, error)
	InsertScheduleMaster(input models.ScheduleMaster) error
	InsertScheduleMasterArray(input []models.ScheduleMaster) ([]models.ScheduleMaster, error)
	DeleteScheduleMaster() error

	ScheduleMasterDistinct(int32) ([]models.ScheduleTimeDto, error)
	ScheduleTimeListByLineCode(int32, int) ([]models.ScheduleTimeDto, error)
	ScheduleMasterList() ([]models.ScheduleMaster, error)
	/* =============================================================
		Μετά τις αλλάγες πριν την παράδοση
	   =============================================================
	*/

	/* =============================================================
		SelectByLineSdcCodeWithTimes επιστρέφει το Master Schedule μαζί με τα αντίστοιχα
		χρονικά σημεία (Schedule Times) για τον συγκεκριμένο κωδικό γραμμής και κωδικό προγράμματος (SDC).

		@param line_code
		@param sdc_code

		@return *models.ScheduleMaster
		@return error
	   ============================================================= */
	SelectByLineSdcCodeWithTimes(int32, int32) (*models.ScheduleMaster, error)
	/* =============================================================
		SelectCurrentSchedule επιστρέφει το δρομολόγιο που ισχύει για τη συγκεκριμένη ημέρ και μήνα.
		Η μέθοδος βασίζεται σε δύο πεδία πίνακα:
			- Ένα πεδίο 12 χαρακτήρων που αντιστοιχεί στους μήνες του έτους (Ιανουάριος–Δεκέμβριος)
			- Ένα πεδίο 7 χαρακτήρων που αντιστοιχεί στις ημέρες της εβδομάδας (Δευτέρα–Κυριακή)
		Κάθε χαρακτήρας στα πεδία αυτά λειτουργεί ως ένδειξη ενεργοποίησης του δρομολογίου
		για τον αντίστοιχο μήνα ή ημέρα. Με βάση τον μήνα και την ημέρα της ημερομηνίας
		εισόδου, η μέθοδος ελέγχει τις αντίστοιχες θέσεις και καθορίζει αν το δρομολόγιο
		είναι ενεργό και πρέπει να ακολουθηθεί.
	   ============================================================= */
	SelectCurrentSchedule(int32, int8, int8) (*models.ScheduleMaster, error)

	/* =============================================================
		SchedulesByLineCode Με αυτή τη διαδικασία ανακτούμε από τη βάση δεδομένων
		τα Master Schedule για την γραμμή με κωδικό γραμμής.\n
		Χωρίς τις λεπτομέρειες των χρονικών σημείων (Schedule Times).\n
		@param lineCode: Κωδικός γραμμής
		@return []models.ScheduleMaster
		@return error
	   ============================================================= */
	ScheduleByLineCode(lineCode int32) ([]models.ScheduleDto, error)
}

type scheduleRepository struct {
	DB *gorm.DB
}

func NewScheduleRepository(connection *gorm.DB) ScheduleRepository {
	return scheduleRepository{
		DB: connection,
	}
}

func (r scheduleRepository) DeleteAll() error {
	if err := r.DB.Table(db.SCHEDULEMASTERTABLE).Where("1=1").Delete(&models.ScheduleMaster{}).Error; err != nil {
		//trans.Rollback()
		return err
	}
	return nil
}

func (r scheduleRepository) WithTx(tx *gorm.DB) scheduleRepository {
	if tx == nil {
		logger.WARN("Database Tranction not exist.")
		return r
	}
	r.DB = tx
	return r
}

func (r scheduleRepository) SelectBySdcCodeLineCode(iLine int64, iSdc int32) (*models.ScheduleMaster, error) {
	var selectedVal models.ScheduleMaster
	res := r.DB.Table(db.SCHEDULEMASTERTABLE).Where("sdc_code = ? AND line_code = ?", iSdc, iLine).Find(&selectedVal)
	if res.Error != nil {
		return nil, res.Error
	}
	return &selectedVal, nil
}

func (r scheduleRepository) InsertScheduleMaster(input models.ScheduleMaster) error {
	res := r.DB.Table(db.SCHEDULEMASTERTABLE).Save(&input)
	if res.Error != nil {
		return res.Error
	}
	return nil
}

func (r scheduleRepository) DeleteScheduleMaster() error {
	if err := r.DB.Table(db.SCHEDULEMASTERTABLE).Where("1=1").Delete(&models.ScheduleMaster{}).Error; err != nil {
		//trans.Rollback()
		return err
	}
	return nil
}

func (r scheduleRepository) InsertScheduleMasterArray(input []models.ScheduleMaster) ([]models.ScheduleMaster, error) {
	res := r.DB.Table(db.SCHEDULEMASTERTABLE).Save(input)
	if res.Error != nil {
		return nil, res.Error
	}
	return input, nil
}

func (r scheduleRepository) SelectByLineSdcCodeWithTimes(lineCode int32, sdcCode int32) (*models.ScheduleMaster, error) {
	var result models.ScheduleMaster
	dbResults := r.DB.Preload("ScheduleTimes", func(db *gorm.DB) *gorm.DB {
		return db.Where("ln_code = ?", lineCode).Order("sort")
	}).Where("sdc_code=?", sdcCode).First(&result)

	if dbResults.Error != nil {
		return nil, fmt.Errorf("Database Error. [%s]", dbResults.Error.Error())
	}

	return &result, nil
}

func (r scheduleRepository) SelectCurrentSchedule(lineCode int32, month int8, day int8) (*models.ScheduleMaster, error) {
	var result models.ScheduleMaster
	var hlpArr []models.ScheduleMaster
	dbResults := r.DB.Preload("ScheduleTimes", func(db *gorm.DB) *gorm.DB {
		return db.Where("ln_code = ?", lineCode).Order("sort")
	}).Find(&hlpArr)

	if dbResults.Error != nil {
		return nil, fmt.Errorf("Database Error. [%s]", dbResults.Error.Error())
	}

	for _, rec := range hlpArr {
		if len(rec.ScheduleTimes) != 0 && string(rec.SDCDays[day]) == "1" && string(rec.SDCMonths[month-1]) == "1" {
			result = rec
			return &result, nil
		}
	}

	return &result, nil
}

func (r scheduleRepository) ScheduleMasterList() ([]models.ScheduleMaster, error) {
	var dbData []models.ScheduleMaster = make([]models.ScheduleMaster, 0)
	if dbResult := r.DB.Table(db.SCHEDULEMASTERTABLE).Select("sdc_code, sdc_descr_eng, sdc_months, sdc_days").Find(&dbData); dbResult.Error != nil {
		return nil, dbResult.Error
	}
	return dbData, nil
}

func (r scheduleRepository) ScheduleByLineCode(lineCode int32) ([]models.ScheduleDto, error) {
	var results []models.ScheduleDto

	subQuery := r.DB.
		Table(db.SCHEDULETIMETABLE).
		Select("DISTINCT sdc_cd").
		Where("ln_code = ?", lineCode)

	err := r.DB.
		Table(db.SCHEDULEMASTERTABLE).
		Select("sdc_descr_eng, sdc_descr, sdc_code").
		Where("sdc_code IN (?)", subQuery).
		Scan(&results).Error

	if err != nil {
		return nil, err
	}
	return results, nil
}

func (r scheduleRepository) ScheduleMasterDistinct(lineCode int32) ([]models.ScheduleTimeDto, error) {
	var dbData []models.ScheduleTimeDto = make([]models.ScheduleTimeDto, 0)
	dbResult := r.DB.Table(db.SCHEDULETIMETABLE).
		Distinct("scheduletime.ln_code, scheduletime.sdc_cd, schedulemaster.sdc_months, schedulemaster.sdc_days").
		Joins(fmt.Sprintf("LEFT JOIN %s ON schedulemaster.sdc_code = scheduletime.sdc_cd", db.SCHEDULEMASTERTABLE)).
		Where("scheduletime.ln_code=?", lineCode).
		Find(&dbData)
	if dbResult.Error != nil {
		return nil, dbResult.Error
	}
	return dbData, nil
}

func (r scheduleRepository) ScheduleTimeListByLineCode(lineCode int32, direction int) ([]models.ScheduleTimeDto, error) {
	var dbData []models.ScheduleTimeDto = make([]models.ScheduleTimeDto, 0)
	dbResult := r.DB.Table(db.SCHEDULEMASTERTABLE).
		Select("scheduletime.ln_code, scheduletime.sdc_cd, schedulemaster.sdc_months, schedulemaster.sdc_days, scheduletime.start_time").
		Joins(fmt.Sprintf("LEFT JOIN %s ON schedulemaster.sdc_code = scheduletime.sdc_cd", db.SCHEDULETIMETABLE)).
		Where("scheduletime.ln_code=? AND scheduletime.direction=?", lineCode, direction).
		Order("schedulemaster.sdc_code, scheduletime.sort").
		Find(&dbData)
	if dbResult.Error != nil {
		return nil, dbResult.Error
	}
	return dbData, nil
}
