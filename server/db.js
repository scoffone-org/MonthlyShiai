import pg from 'pg';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS matches (
    match_number  SERIAL PRIMARY KEY,
    match_date    DATE NOT NULL,
    mat_number    INTEGER NOT NULL CHECK (mat_number >= 1),
    white_name    TEXT NOT NULL,
    blue_name     TEXT NOT NULL,
    winner        TEXT,
    winning_score TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS matches_match_date_idx ON matches (match_date);
`;

/**
 * Connects to PostgreSQL and makes sure the schema exists.
 * Uses DATABASE_URL (Heroku Postgres) when set; otherwise falls back to an embedded
 * PGlite database for local development, stored in PGLITE_DIR (default ./.pgdata).
 * Returns { query(sql, params) => { rows }, close() }.
 */
export async function openDatabase() {
  let db;
  const url = process.env.DATABASE_URL;

  if (url) {
    const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    const pool = new pg.Pool({
      connectionString: url,
      ssl: isLocal || process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
    });
    db = { query: (sql, params) => pool.query(sql, params), exec: (sql) => pool.query(sql), close: () => pool.end() };
  } else {
    const { PGlite } = await import('@electric-sql/pglite');
    const pglite = new PGlite(process.env.PGLITE_DIR ?? './.pgdata');
    db = { query: (sql, params) => pglite.query(sql, params), exec: (sql) => pglite.exec(sql), close: () => pglite.close() };
    console.log('DATABASE_URL not set: using embedded PGlite database');
  }

  await db.exec(SCHEMA);
  return db;
}
