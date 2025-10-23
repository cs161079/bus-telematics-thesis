package main

import (
	logger "github.com/cs161079/monorepo/common/utils/goLogger"
	"github.com/cs161079/monorepo/cronjob/config"
)

func main() {
	// ********* Κάνουμε Create το connection Με την βάση δεδομένων **************
	// dbConnection, err := db.NewOpswConnection()
	// if err != nil {
	// 	logger.ERROR(fmt.Sprintf("Database not established. [%s]", err.Error()))
	// 	return
	// }
	// ***************************************************************************
	// // ******************* Δημιουργόυμε ένα parent Context ***********************
	// var parentContext = context.Background()
	// // ******* Δημιουργούμε ένα Context με Value το connection στην Βάση *********
	// _ = context.WithValue(parentContext, db.CONNECTIONVAR, dbConnection)
	// // ***************************************************************************
	appPtr, err := config.BuildInRuntime()
	if err != nil {
		logger.ERROR(err.Error())
		return
	}
	appPtr.Boot()
}
