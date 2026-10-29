# Monthly Shiai

A single page application for recording match results at a monthly judo tournament, viewing them,
and ranking competitors by points.

- **Front end:** Vue 3 (Composition API), Vue Router, [Element Plus](https://element-plus.org) UI components, built with Vite.
- **Back end:** Node.js + Express 5, PostgreSQL via `pg`.
- **Hosting:** Heroku (Node.js buildpack + Heroku Postgres "essential-0").

## Scoring

| Winning score | Points to winner |
| ------------- | ---------------- |
| Ippon         | 10               |
| Wazari        | 7                |
| Yuko          | 4                |
| Hansokumake   | 2                |
| Tie           | 1 to each competitor |

The loser gets 0 points. The scores, points and validation rules live in [`shared/scores.js`](shared/scores.js)
and are used by both the server and the browser.

## Project layout

```
client/            Vue app (Vite root)
  src/views/       Home, match entry, results, rankings
  src/components/  Date range filter
server/
  app.js           Express routes and SQL
  db.js            PostgreSQL connection + schema creation
  index.js         Entry point
shared/scores.js   Scores, points and match validation (shared)
test/              API tests (node:test)
```

## Running locally

Requires Node.js 24.

```bash
npm install
npm run dev
```

This starts the API on http://localhost:3000 and the Vite dev server on http://localhost:5173
(open this one; it proxies `/api` to the server).

Without `DATABASE_URL`, the server uses an embedded PostgreSQL ([PGlite](https://pglite.dev)) stored in
`./.pgdata`, so no local Postgres install is needed. To use a real Postgres instead:

```bash
DATABASE_URL=postgres://user:pass@localhost:5432/shiai npm run dev
```

To run the production build locally: `npm run build && npm start`, then open http://localhost:3000.

Run the API tests (in-memory database):

```bash
npm test
```

## Deploying to Heroku

```bash
heroku create my-monthly-shiai
heroku addons:create heroku-postgresql:essential-0
git push heroku main
```

Heroku installs dependencies, runs `npm run build` (the Vue client is built into `dist/`), and starts
`npm start` from the `Procfile`. The `matches` table is created automatically on first start.
Heroku sets `DATABASE_URL`; SSL is enabled for non-local databases.

## API

| Method | Path            | Description |
| ------ | --------------- | ----------- |
| POST   | `/api/matches`  | Save a match. Body: `{ matchDate, matNumber, whiteName, blueName, winner, winningScore }`. `winner` is the white or blue name, or empty for a tie (score `Tie`). Returns the new `matchNumber`. |
| PUT    | `/api/matches/:matchNumber` | Replace a match's details (same body and rules as POST). The match number is unchanged. |
| DELETE | `/api/matches/:matchNumber` | Delete a match. Its number is not reused. |
| GET    | `/api/matches`  | Matches sorted by date, then match number, with `points`. Optional `?from=YYYY-MM-DD&to=YYYY-MM-DD`. |
| GET    | `/api/rankings` | Per competitor: `totalPoints`, `wins`, `ties`, `matches`, sorted by points. Same date filters. |

## Notes on the spec

- The match form includes a **mat number** field, since the data model requires it. Like the date,
  it is kept after each save.
- After a save, the loser's name is cleared and the winner's name kept (both are cleared after a tie).
- Names may contain letters (any alphabet), digits and spaces. Extra whitespace is collapsed, and
  rankings group names case-insensitively (`ben ross` and `Ben Ross` count as the same competitor).
- Matches can be corrected or deleted from the results view (Edit / Delete on each row). Deleting
  leaves a gap in the match numbers rather than renumbering later matches.
- Competitors with equal points share a rank; ties within equal points are listed by wins, then name.
