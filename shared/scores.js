// Rules shared by the server and the browser client.

export const TIE = 'Tie';

// Winning scores and the points awarded to the winner (a tie awards 1 point to each competitor).
export const SCORES = [
  { name: 'Ippon', points: 10 },
  { name: 'Wazari', points: 7 },
  { name: 'Yuko', points: 4 },
  { name: 'Hansokumake', points: 2 },
  { name: TIE, points: 1 },
];

export function pointsFor(score) {
  return SCORES.find((s) => s.name === score)?.points ?? 0;
}

// Letters (any alphabet) and digits, words separated by single spaces once normalized.
const NAME_PATTERN = /^[\p{L}\p{N}]+(?: [\p{L}\p{N}]+)*$/u;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeName(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

export function isValidDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/**
 * Validates a match result.
 * Input: { matchDate, matNumber, whiteName, blueName, winner, winningScore }
 * where winner is the white or blue name, or empty for a tie.
 * Returns { errors: { field: message }, value } with normalized values.
 */
export function validateMatch(input = {}) {
  const errors = {};
  const whiteName = normalizeName(input.whiteName);
  const blueName = normalizeName(input.blueName);
  const winner = normalizeName(input.winner);
  const winningScore = String(input.winningScore ?? '');
  const matNumber = Number(input.matNumber);
  const matchDate = String(input.matchDate ?? '');

  if (!isValidDate(matchDate)) errors.matchDate = 'Enter a valid match date';
  if (!Number.isInteger(matNumber) || matNumber < 1) errors.matNumber = 'Mat number must be 1 or more';

  for (const [field, name, label] of [
    ['whiteName', whiteName, 'White'],
    ['blueName', blueName, 'Blue'],
  ]) {
    if (!name) errors[field] = `${label} name is required`;
    else if (name.length > 100) errors[field] = `${label} name is too long`;
    else if (!NAME_PATTERN.test(name)) errors[field] = `${label} name may only contain letters, digits and spaces`;
  }
  if (whiteName && blueName && whiteName.toLowerCase() === blueName.toLowerCase()) {
    errors.blueName = 'White and blue must be different competitors';
  }

  if (!SCORES.some((s) => s.name === winningScore)) {
    errors.winningScore = 'Select a winning score';
  } else if (winningScore === TIE) {
    if (winner) errors.winner = 'Leave the winner empty for a tie';
  } else if (!winner) {
    errors.winner = `Select the winner, or choose ${TIE} as the score`;
  } else if (winner !== whiteName && winner !== blueName) {
    errors.winner = 'The winner must be the white or blue competitor';
  }

  return {
    errors,
    value: { matchDate, matNumber, whiteName, blueName, winner: winner || null, winningScore },
  };
}
