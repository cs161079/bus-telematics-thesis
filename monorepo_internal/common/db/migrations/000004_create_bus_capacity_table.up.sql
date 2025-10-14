CREATE TABLE IF NOT EXISTS bus_capacity (
    id int NOT NULL AUTO_INCREMENT,
    bus_id int NOT NULL,
    route_id int NOT NULL,
    bus_cap int NOT NULL,
    bus_pass int NOT NULL,
    date_time datetime,
    start_time DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `BUS_ROUTE_INDX` (`bus_id`, `route_id`, `date_time`, `start_time`)
);