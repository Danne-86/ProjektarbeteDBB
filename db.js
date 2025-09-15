const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbPath = path.join(__dirname, "database.db");
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, "");
}

const _db = new Database(dbPath);

try {
  _db.pragma("journal_mode = WAL");
  _db.pragma("synchronous = NORMAL");
} catch (_) {}

function _normalizeArgs(sql, params, cb) {
  if (typeof params === "function") {
    return { sql, params: [], cb: params };
  }
  return { sql, params: Array.isArray(params) ? params : [], cb };
}

function run(sql, params, cb) {
  const { sql: s, params: p, cb: done } = _normalizeArgs(sql, params, cb);
  try {
    const info = _db.prepare(s).run(...p);
    if (typeof done === "function") done(null);
    return info;
  } catch (err) {
    if (typeof done === "function") return done(err);
    throw err;
  }
}

function get(sql, params, cb) {
  const { sql: s, params: p, cb: done } = _normalizeArgs(sql, params, cb);
  try {
    const row = _db.prepare(s).get(...p);
    if (typeof done === "function") done(null, row);
    return row;
  } catch (err) {
    if (typeof done === "function") return done(err);
    throw err;
  }
}

function all(sql, params, cb) {
  const { sql: s, params: p, cb: done } = _normalizeArgs(sql, params, cb);
  try {
    const rows = _db.prepare(s).all(...p);
    if (typeof done === "function") done(null, rows);
    return rows;
  } catch (err) {
    if (typeof done === "function") return done(err);
    throw err;
  }
}

run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = {
  run,
  get,
  all,
  prepare: (sql) => _db.prepare(sql),
  _raw: _db,
};
