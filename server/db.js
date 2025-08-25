import Database from "better-sqlite3";

const db = new Database("pj-dev.db");

db.prepare(`
    CREATE TABLE IF NOT EXISTS journal (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        mood TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`).run();

export default db;