import 'dotenv/config';
import BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';

const isTest = process.env.NODE_ENV === 'test';
const DB_PATH = isTest ? ':memory:' : (process.env.DB_PATH || path.join(os.homedir(), '.youtube-remote', 'youtube-remote.db'));

function ensureDir(filePath: string) {
  if (filePath === ':memory:') return;
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDir(DB_PATH);

export const db: BetterSqlite3.Database = new BetterSqlite3(DB_PATH);

// Initialize tables immediately on module load so any importer can use them
db.exec(`
  ${isTest ? '' : 'PRAGMA journal_mode = WAL;'}
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    channel TEXT NOT NULL,
    thumbnail TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 0,
    added_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    channel TEXT NOT NULL,
    thumbnail TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 0,
    played_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS queue_persist (
    id INTEGER PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT 'iPhone',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_seen TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export function initDatabase() {
  // Tables already created at module load time. This function kept for explicit call in index.ts.
  console.log('[youtube-remote] Database ready at ' + DB_PATH);
}
