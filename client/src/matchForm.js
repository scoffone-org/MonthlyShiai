// Conversions between the editable form state and the API's match shape.
// The form tracks the winner by side ('white', 'blue', or '' for a tie) so renaming a competitor keeps the choice.

import { normalizeName } from '@shared/scores.js';
import { today } from './dates.js';

export function emptyForm() {
  return { matchDate: today(), matNumber: 1, whiteName: '', blueName: '', winnerSide: '', winningScore: '' };
}

export function formFromMatch(m) {
  const winnerSide = !m.winner ? '' : m.winner === m.whiteName ? 'white' : m.winner === m.blueName ? 'blue' : '';
  return { matchDate: m.matchDate, matNumber: m.matNumber, whiteName: m.whiteName, blueName: m.blueName, winnerSide, winningScore: m.winningScore };
}

export function winnerName(form) {
  if (form.winnerSide === 'white') return normalizeName(form.whiteName);
  if (form.winnerSide === 'blue') return normalizeName(form.blueName);
  return '';
}

export function matchFromForm(form) {
  return {
    matchDate: form.matchDate,
    matNumber: form.matNumber,
    whiteName: form.whiteName,
    blueName: form.blueName,
    winner: winnerName(form),
    winningScore: form.winningScore,
  };
}
