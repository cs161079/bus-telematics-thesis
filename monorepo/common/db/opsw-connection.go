package db

import (
	"fmt"
	"os"
	"strconv"
	"time"

	logger "github.com/cs161079/monorepo/common/utils/goLogger"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/mysql"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

type Datasource interface {
	DatasourceUrl() (string, error)
}

type datasource struct {
	Address      string
	Port         int32
	User         string
	Password     string
	DatabaseName string
}

func (ds datasource) DatasourceUrl() string {
	return fmt.Sprintf(dataSourceFormat, ds.User, ds.Password,
		ds.Address, ds.Port, ds.DatabaseName)

}

const (
	// *ΓΙΑ ΤΙΣ ΜΕΤΑΒΛΗΤΕΣ ΠΟΥ ΔΙΑΜΟΙΡΑΖΟΜΑΙ ΜΕΣΩ CONTEXT *
	CONNECTIONVAR = "db_conn"
	//*****************************************************
	// ****** ΟΝΟΜΑΤΑ ΠΙΝΑΚΩΝ ΣΤΗΝ ΒΑΣΗ ΔΕΔΟΜΕΝΩΝ *********
	LINETABLE           = "line"
	ROUTETABLE          = "route"
	STOPTABLE           = "stop"
	ROUTESTOPSTABLE     = "route02"
	SCHEDULEMASTERTABLE = "schedulemaster"
	SCHEDULETIMETABLE   = "scheduletime"
	SCHEDULELINE        = "scheduleline"
	ROUTEDETAILTABLE    = "route01"
	SYNCVERSIONSTABLE   = "syncversions"
	OPSWCRONRUNS        = "opswCronRuns"
	BUSCAPACITY         = "bus_capacity"
	// ****************************************************
)

const dataSourceFormat = "%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=true&loc=Local"

func createDataSource() (*datasource, error) {
	// ******** Φορτώνουμε τις μεταβλητές ************************
	// err := godotenv.Load(".env")
	// if err != nil {
	// 	return nil, fmt.Errorf("Error loading enviroment variables.[%s]", err.Error())
	// }

	// ******** Get Database IP from env, if empty put a default IP ******************
	ip := os.Getenv("database.ip")
	var defaultIp = "127.0.0.1"
	if ip == "" {
		ip = defaultIp
	}
	// *******************************************************************************

	// ************* Get Database port from env, if empty put a default port *********
	var port int32 = 3306
	portStr := os.Getenv("database.port")
	if portStr != "" {
		port64, err := strconv.ParseInt(portStr, 10, 32)
		if err != nil {
			logger.ERROR("Error convering database port from string to number. Default Port Selected")
		} else {
			port = int32(port64)
		}
	}
	// ********************************************************************************

	// ************ Rest information for database connection **************************
	user := os.Getenv("database.user")
	password := os.Getenv("database.password")
	database := os.Getenv("database.dbname")
	// ********************************************************************************

	return &datasource{
		Address:      ip,
		Port:         port,
		User:         user,
		Password:     password,
		DatabaseName: database,
	}, nil
}

func getGormConfig() *gorm.Config {
	gormLogger := logger.GetGormLogger()
	if gormLogger == nil {
		return &gorm.Config{
			Logger: gormlogger.Default.LogMode(gormlogger.Silent),
		}
	}
	return &gorm.Config{
		Logger: gormLogger,
	}
}

// This is core for DB

func NewOpswConnection() (*gorm.DB, error) {
	dataSource, err := createDataSource()
	if err != nil {
		return nil, err
	}

	dialector := mysql.New(mysql.Config{
		DSN:                       dataSource.DatasourceUrl(), // data source name
		DefaultStringSize:         256,                        // default size for string fields
		DisableDatetimePrecision:  true,                       // disable datetime precision, which not supported before MySQL 5.6
		DontSupportRenameIndex:    true,                       // drop & create when rename index, rename index not supported before MySQL 5.7, MariaDB
		DontSupportRenameColumn:   true,                       // `change` when rename column, rename column not supported before MySQL 8, MariaDB
		SkipInitializeWithVersion: false,                      // auto configure based on currently MySQL version
	})

	db, err := gorm.Open(dialector, getGormConfig())

	if err != nil {
		// fmt.Println("An Error occured on creation of database connection")
		return nil, err
	}

	sqlDb, err := db.DB()
	if err != nil {
		return nil, err
	}
	sqlDb.SetMaxIdleConns(5)
	sqlDb.SetConnMaxLifetime(time.Minute)
	sqlDb.SetMaxOpenConns(5)

	return db, nil
}

func DatabaseMigrations() error {
	datasource, err := createDataSource()
	if err != nil {
		return err
	}

	// exe, err := os.Executable()
	// if err != nil {
	// 	logger.ERROR(fmt.Sprintf("cannot get executable path: %v", err))
	// }

	//migrationsPath := "common/db/migrations" //filepath.Join(filepath.Dir(exe), "..", "common", "db", "migrations")
	migrationsPath := os.Getenv("database.migration.folder")
	if migrationsPath == "" {
		return fmt.Errorf("Δεν έχει οριστεί διαδρομή για migration files.")
	}
	m, err := migrate.New(
		"file://"+migrationsPath,
		"mysql://"+datasource.DatasourceUrl(),
	)
	if err != nil {
		// log.Fatalf("failed to initialize migrate: %v", err)
		return err
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		//return fmt.Errorf("Migration Up failed: %v", err)
		logger.ERROR(fmt.Sprintf("Migration Up failed: %v", err))
	}
	logger.INFO("Migrate UP become successfully!")

	// if err := m.Down(); err != nil && err != migrate.ErrNoChange {
	// 	// return fmt.Errorf("Migration Down failed. %v", err)
	// 	logger.ERROR(fmt.Sprintf("Migration Down failed: %v", err))
	// }
	// logger.INFO("Migrate DONW become successfully!")
	return nil
}
