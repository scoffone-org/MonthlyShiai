// Thin wrapper around the server's JSON API.

async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const body = res.status === 204 ? {} : await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.details = body.details;
    throw err;
  }
  return body;
}

function rangeQuery(range) {
  const params = new URLSearchParams();
  if (range?.[0]) params.set('from', range[0]);
  if (range?.[1]) params.set('to', range[1]);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const saveMatch = (match) => request('/api/matches', { method: 'POST', body: JSON.stringify(match) });
export const updateMatch = (matchNumber, match) =>
  request(`/api/matches/${matchNumber}`, { method: 'PUT', body: JSON.stringify(match) });
export const deleteMatch = (matchNumber) => request(`/api/matches/${matchNumber}`, { method: 'DELETE' });
export const fetchMatches =(range) => request(`/api/matches${rangeQuery(range)}`);
export const fetchRankings = (range) => request(`/api/rankings${rangeQuery(range)}`);
