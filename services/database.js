import * as SQLite from "expo-sqlite";

let databasePromise = null;

async function migrate(db) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS training_logs (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE INDEX IF NOT EXISTS idx_training_logs_user_id
      ON training_logs(user_id);

    CREATE TABLE IF NOT EXISTS routines (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT,
      category TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'synced'
    );

    CREATE INDEX IF NOT EXISTS idx_routines_user_id
      ON routines(user_id);

    CREATE INDEX IF NOT EXISTS idx_routines_category
      ON routines(category);

    CREATE TABLE IF NOT EXISTS outbox (
      id TEXT PRIMARY KEY NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sync_state (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );
  `);
}

export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync("hoopflex.db").then(async (db) => {
      await migrate(db);
      return db;
    });
  }

  return databasePromise;
}
