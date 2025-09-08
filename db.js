// db.js
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.db");

db.run("PRAGMA foreign_keys = ON;"); // Enable foreign key constraints

module.exports = db;
