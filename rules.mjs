export const initial = () => [
  'rheakaehr', '.........', '.c.....c.', 'p.p.p.p.p', '.........',
  '.........', 'P.P.P.P.P', '.C.....C.', '.........', 'RHEAKAEHR',
].join('').split('');
export const side = piece => piece === '.' ? 0 : piece === piece.toUpperCase() ? 1 : -1;

function reaches(board, from, to) {
  const team = side(board[from]);
  const x = from % 9, y = Math.floor(from / 9);
  const u = to % 9, v = Math.floor(to / 9);
  const dx = u - x, dy = v - y, a = Math.abs(dx), b = Math.abs(dy);
  if (!team || from === to || side(board[to]) === team) return false;
  const crossed = team === 1 ? y <= 4 : y >= 5;
  const palace = u >= 3 && u <= 5 && (team === 1 ? v >= 7 : v <= 2);
  switch (board[from].toLowerCase()) {
    case 'p': return (dx === 0 && dy === -team) || (crossed && a === 1 && dy === 0);
    case 'a': return palace && a === 1 && b === 1;
    case 'e': return a === 2 && b === 2 && (team === 1 ? v >= 5 : v <= 4)
      && board[from + dx / 2 + 9 * dy / 2] === '.';
    case 'h':
      return ((a === 2 && b === 1) || (a === 1 && b === 2))
        && board[from + (a === 2 ? Math.sign(dx) : 9 * Math.sign(dy))] === '.';
    case 'k':
      if (palace && a + b === 1) return true;
      if (dx || board[to].toLowerCase() !== 'k') return false;
      break;
    default:
      if (dx && dy) return false;
  }
  const step = Math.sign(dx) + 9 * Math.sign(dy);
  let blockers = 0;
  for (let index = from + step; index !== to; index += step) {
    if (board[index] !== '.') blockers++;
  }
  return blockers === (board[from].toLowerCase() === 'c' && board[to] !== '.' ? 1 : 0);
}

export function play(board, [from, to]) {
  const next = board.slice();
  next[to] = next[from];
  next[from] = '.';
  return next;
}

export function check(board, team) {
  const king = board.indexOf(team === 1 ? 'K' : 'k');
  return king < 0 || board.some((piece, from) => side(piece) === -team && reaches(board, from, king));
}

export function moves(board, team, selected) {
  const result = [];
  const start = selected ?? 0, end = selected === undefined ? 90 : selected + 1;
  for (let from = start; from < end; from++) {
    if (side(board[from]) !== team) continue;
    for (let to = 0; to < 90; to++) {
      if (reaches(board, from, to) && !check(play(board, [from, to]), team)) result.push([from, to]);
    }
  }
  return result;
}

export function outcome(history, board, team) {
  if (!moves(board, team).length) return -team;
  const key = board.join('');
  const occurrences = history.map((position, index) => ({ position, index }))
    .filter(({ position, index }) => position.join('') === key && index % 2 === (history.length - 1) % 2);
  if (occurrences.length < 3) return null;
  const start = occurrences.at(-3).index;
  const cycle = history.slice(start + 1);
  const redChecks = cycle.filter((_, index) => (start + index) % 2 === 0).every(position => check(position, -1));
  const blackChecks = cycle.filter((_, index) => (start + index) % 2 === 1).every(position => check(position, 1));
  return redChecks === blackChecks ? 0 : redChecks ? -1 : 1;
}
