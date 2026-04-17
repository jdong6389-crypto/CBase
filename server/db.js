import initSqlJs from 'sql.js'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import bcrypt from 'bcryptjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', 'cbase.db')

let db

// sql.js is async, we need to init before use
const SQL = await initSqlJs()

if (fs.existsSync(DB_PATH)) {
  const buf = fs.readFileSync(DB_PATH)
  db = new SQL.Database(buf)
} else {
  db = new SQL.Database()
}

// Save helper — writes db to disk
export function saveDB() {
  const data = db.export()
  fs.writeFileSync(DB_PATH, Buffer.from(data))
}

// Create tables
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    group_name TEXT DEFAULT '',
    role TEXT DEFAULT 'member',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )
`)
db.run(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )
`)
db.run(`
  CREATE TABLE IF NOT EXISTS factors (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    value REAL,
    unit TEXT,
    source TEXT,
    version TEXT,
    year TEXT,
    spatial_scope TEXT,
    spatial_note TEXT,
    boundary_note TEXT,
    application_examples TEXT,
    caution_examples TEXT,
    usage_notes TEXT,
    created_by INTEGER,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  )
`)
db.run(`
  CREATE TABLE IF NOT EXISTS packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_by INTEGER,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )
`)
db.run(`
  CREATE TABLE IF NOT EXISTS usages (
    id TEXT PRIMARY KEY,
    package_id TEXT NOT NULL,
    factor_id TEXT NOT NULL,
    obj TEXT,
    stage TEXT,
    process TEXT,
    note TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )
`)
db.run(`
  CREATE TABLE IF NOT EXISTS factor_edits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    factor_id TEXT NOT NULL,
    submitted_by INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    reject_reason TEXT,
    name TEXT, type TEXT, value REAL, unit TEXT, source TEXT, version TEXT, year TEXT,
    spatial_scope TEXT, spatial_note TEXT, boundary_note TEXT,
    application_examples TEXT, caution_examples TEXT, usage_notes TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    reviewed_at TEXT,
    reviewed_by INTEGER
  )
`)

// Helper: run query and return rows as objects
export function all(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

export function get(sql, params = []) {
  const rows = all(sql, params)
  return rows[0] || null
}

export function run(sql, params = []) {
  db.run(sql, params)
  saveDB()
}

export function insert(sql, params = []) {
  db.run(sql, params)
  const result = db.exec("SELECT last_insert_rowid()")
  const lastId = result.length > 0 ? result[0].values[0][0] : null
  saveDB()
  return lastId
}

// Seed factors from JSON if table is empty
const count = get('SELECT COUNT(*) as c FROM factors')
if (count && count.c === 0) {
  const seedPath = path.join(__dirname, '..', 'data', 'factors.json')
  if (fs.existsSync(seedPath)) {
    const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'))
    for (const f of seedData) {
      db.run(
        `INSERT INTO factors (id, type, name, value, unit, source, version, year,
          spatial_scope, spatial_note, boundary_note, application_examples, caution_examples, usage_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [f.id, f.type, f.name, f.value, f.unit, f.source, f.version, f.year,
          f.spatial_scope, f.spatial_note, f.boundary_note,
          JSON.stringify(f.application_examples || []),
          JSON.stringify(f.caution_examples || []),
          f.usage_notes || '']
      )
    }
    saveDB()
    console.log(`Seeded ${seedData.length} factors from factors.json`)
  }
}

// Create default admin account if no admin exists
const adminExists = get("SELECT id FROM users WHERE role = 'admin'")
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10)
  db.run(
    "INSERT INTO users (username, password_hash, display_name, group_name, role) VALUES (?, ?, ?, ?, ?)",
    ['admin', hash, '管理员', '', 'admin']
  )
  saveDB()
  console.log('Created default admin account (username: admin, password: admin123)')
}

export default db
