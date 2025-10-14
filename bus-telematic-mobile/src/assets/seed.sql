CREATE TABLE IF NOT EXISTS stops(
	id 	 INTEGER PRIMARY KEY AUTOINCREMENT,
  stop_code    INTEGER,
  stop_data   TEXT
);

create TABLE IF NOT EXISTS lines(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  line_code  INTEGER,
  line_data TEXT,
  mode INTEGER
);
