CREATE TABLE IF NOT EXISTS applications (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 parent_name TEXT NOT NULL,
 phone TEXT NOT NULL,
 child_name TEXT NOT NULL,
 child_birth_date TEXT NOT NULL,
 course_key TEXT NOT NULL,
 course_name TEXT NOT NULL,
 additional_info TEXT DEFAULT '',
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_applications_id ON applications(id DESC);
