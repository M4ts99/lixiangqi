import { rank } from './engine.mjs';

self.onmessage = ({ data }) => {
  const { id, board, team, depth, compare } = data;
  const ranked = rank(board, team, depth, compare);
  const choice = depth === 1 && !compare
    ? ranked[Math.floor(Math.random() * Math.min(5, ranked.length))]
    : ranked[0];
  self.postMessage({ id, choice, ranked: compare ? ranked : undefined });
};
