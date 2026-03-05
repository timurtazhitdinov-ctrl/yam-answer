const Database = require('better-sqlite3');
const path = require('path');

// Railway Volume should be mounted at /data, fallback to local for dev
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data.db');

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS promo_codes (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    code      TEXT NOT NULL UNIQUE,
    used      INTEGER NOT NULL DEFAULT 0,
    used_at   TEXT,
    chat_id   TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS replied_chats (
    chat_id    TEXT PRIMARY KEY,
    replied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// --- Promo codes ---

function addCode(code) {
  return db
    .prepare(`INSERT OR IGNORE INTO promo_codes (code) VALUES (?)`)
    .run(code.trim().toUpperCase());
}

function addCodes(codes) {
  const insert = db.prepare(`INSERT OR IGNORE INTO promo_codes (code) VALUES (?)`);
  const insertMany = db.transaction((list) => {
    for (const code of list) insert.run(code.trim().toUpperCase());
  });
  insertMany(codes);
}

function getNextCode() {
  return db
    .prepare(`SELECT * FROM promo_codes WHERE used = 0 ORDER BY id ASC LIMIT 1`)
    .get();
}

function markCodeUsed(id, chatId) {
  return db
    .prepare(`UPDATE promo_codes SET used = 1, used_at = datetime('now'), chat_id = ? WHERE id = ?`)
    .run(chatId, id);
}

function listCodes() {
  return db.prepare(`SELECT * FROM promo_codes ORDER BY id DESC`).all();
}

function countAvailable() {
  return db.prepare(`SELECT COUNT(*) as n FROM promo_codes WHERE used = 0`).get().n;
}

// --- Replied chats ---

function hasReplied(chatId) {
  return !!db
    .prepare(`SELECT 1 FROM replied_chats WHERE chat_id = ?`)
    .get(String(chatId));
}

function markReplied(chatId) {
  return db
    .prepare(`INSERT OR IGNORE INTO replied_chats (chat_id) VALUES (?)`)
    .run(String(chatId));
}

module.exports = {
  addCode,
  addCodes,
  getNextCode,
  markCodeUsed,
  listCodes,
  countAvailable,
  hasReplied,
  markReplied,
};
