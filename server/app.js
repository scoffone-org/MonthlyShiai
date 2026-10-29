import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SCORES, isValidDate, validateMatch } from '../shared/scores.js';

const CLIENT_DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');

// Points for the winning score, built from the shared constants (no user input involved).
const POINTS_SQL = `CASE winning_score ${SCORES.map((s) => `WHEN '${s.name}' THEN ${s.points}`).join(' ')} ELSE 0 END`;

class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Builds a WHERE clause for the optional ?from=YYYY-MM-DD&to=YYYY-MM-DD date range (inclusive).
function dateRange(query) {
  const conditions = [];
  const params = [];
  for (const [key, op] of [['from', '>='], ['to', '<=']]) {
    const value = query[key];
    if (value === undefined || value === '') continue;
    if (!isValidDate(value)) throw new HttpError(400, `Invalid '${key}' date, expected YYYY-MM-DD`);
    params.push(value);
    conditions.push(`match_date ${op} $${params.length}::date`);
  }
  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
}

function parseMatchNumber(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new HttpError(400, 'Invalid match number');
  return n;
}

export function createApp(db) {
  const app = express();
  app.use(express.json());

  app.get('/api/health', async (_req, res) => {
    await db.query('SELECT 1');
    res.json({ ok: true });
  });

  app.post('/api/matches', async (req, res) => {
    const { errors, value } = validateMatch(req.body);
    if (Object.keys(errors).length) throw new HttpError(400, 'Invalid match result', errors);

    const { rows } = await db.query(
      `INSERT INTO matches (match_date, mat_number, white_name, blue_name, winner, winning_score)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING match_number`,
      [value.matchDate, value.matNumber, value.whiteName, value.blueName, value.winner, value.winningScore],
    );
    res.status(201).json({ matchNumber: rows[0].match_number, ...value });
  });

  app.put('/api/matches/:matchNumber', async (req, res) => {
    const matchNumber = parseMatchNumber(req.params.matchNumber);
    const { errors, value } = validateMatch(req.body);
    if (Object.keys(errors).length) throw new HttpError(400, 'Invalid match result', errors);

    const { rows } = await db.query(
      `UPDATE matches
       SET match_date = $1, mat_number = $2, white_name = $3, blue_name = $4, winner = $5, winning_score = $6
       WHERE match_number = $7
       RETURNING match_number`,
      [value.matchDate, value.matNumber, value.whiteName, value.blueName, value.winner, value.winningScore, matchNumber],
    );
    if (!rows.length) throw new HttpError(404, `Match #${matchNumber} not found`);
    res.json({ matchNumber, ...value });
  });

  app.delete('/api/matches/:matchNumber', async (req, res) => {
    const matchNumber = parseMatchNumber(req.params.matchNumber);
    const { rows } = await db.query('DELETE FROM matches WHERE match_number = $1 RETURNING match_number', [matchNumber]);
    if (!rows.length) throw new HttpError(404, `Match #${matchNumber} not found`);
    res.status(204).end();
  });

  app.get('/api/matches', async (req, res) => {
    const { where, params } = dateRange(req.query);
    const { rows } = await db.query(
      `SELECT match_number AS "matchNumber",
              to_char(match_date, 'YYYY-MM-DD') AS "matchDate",
              mat_number AS "matNumber",
              white_name AS "whiteName",
              blue_name AS "blueName",
              winner,
              winning_score AS "winningScore",
              ${POINTS_SQL} AS points
       FROM matches ${where}
       ORDER BY match_number ASC`,
      params,
    );
    res.json(rows);
  });

  app.get('/api/rankings', async (req, res) => {
    const { where, params } = dateRange(req.query);
    // One row per competitor per match; names are grouped case-insensitively.
    const { rows } = await db.query(
      `WITH m AS (
         SELECT white_name, blue_name, winner, ${POINTS_SQL} AS points FROM matches ${where}
       ), sides AS (
         SELECT white_name AS name, winner = white_name AS won, winner IS NULL AS tied, points FROM m
         UNION ALL
         SELECT blue_name, winner = blue_name, winner IS NULL, points FROM m
       )
       SELECT MIN(name) AS name,
              SUM(CASE WHEN tied THEN 1 WHEN won THEN points ELSE 0 END)::int AS "totalPoints",
              COUNT(*) FILTER (WHERE won)::int AS wins,
              COUNT(*) FILTER (WHERE tied)::int AS ties,
              COUNT(*)::int AS matches
       FROM sides
       GROUP BY lower(name)
       ORDER BY "totalPoints" DESC, wins DESC, lower(MIN(name)) ASC`,
      params,
    );
    res.json(rows);
  });

  app.use('/api', (_req, _res) => {
    throw new HttpError(404, 'Not found');
  });

  // Serve the built Vue client, falling back to index.html for client-side routes.
  if (fs.existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST));
    app.get('/{*path}', (_req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
  }

  app.use((err, _req, res, _next) => {
    const status = err.status ?? (err.type === 'entity.parse.failed' ? 400 : 500);
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message, details: err.details });
  });

  return app;
}
