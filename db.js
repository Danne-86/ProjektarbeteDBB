const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbPath = path.join(__dirname, "database.db");
const db = new Database(dbPath);
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, "");
}

db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
  )
    `);
db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    header TEXT NOT NULL,
    content TEXT NOT NULL,
    is_flagged BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )
        `);
db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_flagged BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
  )
    `);
db.exec(`
      CREATE TABLE IF NOT EXISTS likes (
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, post_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
      )
      `);

try {
  const cols = db.prepare(`PRAGMA table_info(posts)`).all();
  const hasHero = cols.some((c) => c.name === "hero_image");
  if (!hasHero) {
    db.exec(`ALTER TABLE posts ADD COLUMN hero_image TEXT`);
  }
} catch (e) {
  console.error("[DB] Failed to ensure posts.hero_image:", e);
}

function _normalizeArgs(sql, params, cb) {
  if (typeof params === "function") {
    return { sql, params: [], cb: params };
  }
  return { sql, params: Array.isArray(params) ? params : [], cb };
}

function run(sql, params, cb) {
  const { sql: s, params: p, cb: done } = _normalizeArgs(sql, params, cb);
  try {
    const info = db.prepare(s).run(...p);
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
    const row = db.prepare(s).get(...p);
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
    const rows = db.prepare(s).all(...p);
    if (typeof done === "function") done(null, rows);
    return rows;
  } catch (err) {
    if (typeof done === "function") return done(err);
    throw err;
  }
}

module.exports = {
  run,
  get,
  all,
  prepare: (sql) => db.prepare(sql),
  _raw: db,
};
