import { moves, play, side } from './rules.mjs';

const values = { p: 100, a: 210, e: 210, h: 430, c: 460, r: 950, k: 20000, '.': 0 };
const value = piece => values[piece.toLowerCase()];
function evaluate(board) {
  return board.reduce((total, piece, square) => {
    const team = side(piece);
    const advance = team === 1 ? 9 - Math.floor(square / 9) : Math.floor(square / 9);
    const central = 4 - Math.abs(4 - square % 9);
    const kind = piece.toLowerCase();
    const bonus = kind === 'p' ? advance * 9 + central * 5
      : 'hcr'.includes(kind) ? central * 8 + Math.min(advance, 5) * 3 : 0;
    return total + team * (value(piece) + bonus);
  }, 0);
}

function ordered(board, team) {
  return moves(board, team).sort((a, b) => value(board[b[1]]) - value(board[a[1]]));
}

function search(board, team, depth, alpha, beta, ply) {
  if (depth === 0) return team * evaluate(board);
  const legal = ordered(board, team);
  if (!legal.length) return -30000 + ply;
  let best = -Infinity;
  for (const move of legal) {
    const score = -search(play(board, move), -team, depth - 1, -beta, -alpha, ply + 1);
    best = Math.max(best, score);
    alpha = Math.max(alpha, best);
    if (alpha >= beta) break;
  }
  return best;
}

export function rank(board, team, depth, compare) {
  const legal = ordered(board, team);
  if (!legal.length) return [];
  if (depth < 3 || compare) return legal.map(move => ({
    move, score: -search(play(board, move), -team, depth - 1, -Infinity, Infinity, 1),
  })).sort((a, b) => b.score - a.score);
  let best = { move: legal[0], score: -Infinity };
  for (const move of legal) {
    const score = -search(play(board, move), -team, depth - 1, -Infinity, -best.score, 1);
    if (score > best.score) best = { move, score };
  }
  return [best];
}
