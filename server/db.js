const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('timeflow.db');

// Tworzenie tabel, jeśli nie istnieją
db.serialize(() => {
  db.run(
    'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, nick TEXT UNIQUE, password TEXT)'
  );
	db.run(
	`CREATE TABLE IF NOT EXISTS tasks (
		id INTEGER PRIMARY KEY,
		nick TEXT,
		text TEXT,
		done INTEGER,
		description TEXT,
		dueDate TEXT,
		priority TEXT,
		tags TEXT,
		type TEXT
	)`
);

});

module.exports = db;
