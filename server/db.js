const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = process.env.TIMEFLOW_DB_PATH || path.join(__dirname, 'timeflow.db');
const db = new sqlite3.Database(dbPath);

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
  db.run(
    `CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY,
      nick TEXT UNIQUE,
      name TEXT,
      email TEXT,
      avatarUrl TEXT,
      timezone TEXT,
      updatedAt TEXT
    )`
  );
  db.run(
    `CREATE TABLE IF NOT EXISTS preferences (
      id INTEGER PRIMARY KEY,
      nick TEXT UNIQUE,
      theme TEXT,
      showWeather INTEGER,
      showQuote INTEGER,
      autoExpandCompleted INTEGER,
      defaultPriority TEXT,
      defaultType TEXT,
      updatedAt TEXT
    )`
  );

  db.run('ALTER TABLE preferences ADD COLUMN defaultPriority TEXT', () => {});
  db.run('ALTER TABLE preferences ADD COLUMN defaultType TEXT', () => {});

});

module.exports = db;
