import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.PGLITE_DIR = 'memory://';
delete process.env.DATABASE_URL;

const { openDatabase } = await import('../server/db.js');
const { createApp } = await import('../server/app.js');

let db, server, base;

before(async () => {
  db = await openDatabase();
  server = createApp(db).listen(0);
  base = `http://localhost:${server.address().port}`;
});

after(async () => {
  server.close();
  await db.close();
});

const post = (body) =>
  fetch(`${base}/api/matches`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const get = (path) => fetch(`${base}${path}`).then((r) => r.json());

const match = (overrides) => ({ matchDate: '2026-10-03', matNumber: 1, whiteName: 'Aiko Tanaka', blueName: 'Ben Ross', winner: 'Aiko Tanaka', winningScore: 'Ippon', ...overrides });

test('saves matches with increasing sequence numbers', async () => {
  const r1 = await post(match());
  assert.equal(r1.status, 201);
  const r2 = await post(match({ blueName: 'Carla  Diaz ', winner: 'Carla Diaz', winningScore: 'Wazari', matNumber: 2 }));
  const r3 = await post(match({ matchDate: '2026-11-07', blueName: 'Ben Ross', winner: '', winningScore: 'Tie' }));
  const r4 = await post(match({ matchDate: '2026-11-07', whiteName: 'ben ross', blueName: 'Carla Diaz', winner: 'ben ross', winningScore: 'Hansokumake' }));
  const ids = await Promise.all([r1, r2, r3, r4].map((r) => r.json().then((b) => b.matchNumber)));
  assert.deepEqual(ids, [1, 2, 3, 4]);
});

test('rejects invalid results', async () => {
  const cases = [
    [match({ winner: '', winningScore: 'Ippon' }), 'winner'],
    [match({ winningScore: 'Tie' }), 'winner'],
    [match({ winner: 'Someone Else' }), 'winner'],
    [match({ winningScore: 'Koka' }), 'winningScore'],
    [match({ whiteName: 'Bad<name>' }), 'whiteName'],
    [match({ blueName: 'aiko tanaka', winner: 'Aiko Tanaka' }), 'blueName'],
    [match({ matNumber: 0 }), 'matNumber'],
    [match({ matchDate: '2026-02-30' }), 'matchDate'],
  ];
  for (const [body, field] of cases) {
    const res = await post(body);
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.ok((await res.json()).details[field], `expected error on ${field}`);
  }
});

test('lists results with points, filtered by date', async () => {
  const all = await get('/api/matches');
  assert.deepEqual(all.map((m) => m.matchNumber), [1, 2, 3, 4]);
  assert.deepEqual(all.map((m) => m.points), [10, 7, 1, 2]);
  assert.equal(all[1].blueName, 'Carla Diaz');
  assert.equal(all[2].winner, null);

  const october = await get('/api/matches?from=2026-10-01&to=2026-10-31');
  assert.deepEqual(october.map((m) => m.matchNumber), [1, 2]);
  const fromNov = await get('/api/matches?from=2026-11-07');
  assert.deepEqual(fromNov.map((m) => m.matchNumber), [3, 4]);

  const bad = await fetch(`${base}/api/matches?from=yesterday`);
  assert.equal(bad.status, 400);
});

test('ranks competitors by total points', async () => {
  const rankings = await get('/api/rankings');
  assert.deepEqual(
    rankings.map(({ name, totalPoints, wins, ties, matches }) => [name, totalPoints, wins, ties, matches]),
    [
      ['Aiko Tanaka', 11, 1, 1, 3],
      ['Carla Diaz', 7, 1, 0, 2],
      ['Ben Ross', 3, 1, 1, 3],
    ],
  );

  const october = await get('/api/rankings?from=2026-10-01&to=2026-10-31');
  assert.deepEqual(october.map((r) => [r.name, r.totalPoints]), [['Aiko Tanaka', 10], ['Carla Diaz', 7], ['Ben Ross', 0]]);
});

const send = (method, path, body) =>
  fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });

test('updates a match in place', async () => {
  const res = await send('PUT', '/api/matches/2', match({ blueName: 'Carla Diaz', winner: 'Carla Diaz', winningScore: 'Ippon', matNumber: 3 }));
  assert.equal(res.status, 200);
  assert.equal((await res.json()).matchNumber, 2);

  const updated = (await get('/api/matches')).find((m) => m.matchNumber === 2);
  assert.deepEqual([updated.winner, updated.winningScore, updated.points, updated.matNumber], ['Carla Diaz', 'Ippon', 10, 3]);

  assert.equal((await send('PUT', '/api/matches/2', match({ winningScore: 'Tie' }))).status, 400);
  assert.equal((await send('PUT', '/api/matches/999', match())).status, 404);
  assert.equal((await send('PUT', '/api/matches/abc', match())).status, 400);
});

test('deletes a match without reusing its number', async () => {
  assert.equal((await send('DELETE', '/api/matches/1')).status, 204);
  assert.equal((await send('DELETE', '/api/matches/1')).status, 404);
  assert.deepEqual((await get('/api/matches')).map((m) => m.matchNumber), [2, 3, 4]);

  const created = await (await post(match())).json();
  assert.equal(created.matchNumber, 5);
});

test('lists results by date, then match number', async () => {
  // Match 5 was entered last but is dated 2026-10-03, before matches 3 and 4.
  assert.deepEqual((await get('/api/matches')).map((m) => m.matchNumber), [2, 5, 3, 4]);
});
