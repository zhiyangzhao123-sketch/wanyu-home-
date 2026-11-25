// 国际象棋的 AI：α-β 搜索 + 子力估值 + 简单的格子表。
// 规则全部交给 chess.js（易位、吃过路兵、升变、逼和、三次重复都由它判），
// 这里只负责“选哪一步”。

import { Chess } from "chess.js";

const VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// 中心更好的粗表（正值对白方有利），只用来区分“差不多好”的着法
const CENTER = [
  -10, -5, 0, 5, 5, 0, -5, -10,
  -5, 0, 5, 10, 10, 5, 0, -5,
  0, 5, 10, 15, 15, 10, 5, 0,
  5, 10, 15, 20, 20, 15, 10, 5,
  5, 10, 15, 20, 20, 15, 10, 5,
  0, 5, 10, 15, 15, 10, 5, 0,
  -5, 0, 5, 10, 10, 5, 0, -5,
  -10, -5, 0, 5, 5, 0, -5, -10,
];

/** 从“轮到走棋的一方”看的分数。 */
export function evaluate(game) {
  const board = game.board();
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = board[r][c];
      if (!sq) continue;
      const idx = r * 8 + c;
      const v = VALUE[sq.type] + CENTER[idx];
      score += sq.color === "w" ? v : -v;
    }
  }
  return game.turn() === "w" ? score : -score;
}

const MATE = 100000;

function orderedMoves(game) {
  const moves = game.moves({ verbose: true });
  // 吃子优先，升变次之，剪枝更有效
  moves.sort((a, b) => {
    const va = (a.captured ? VALUE[a.captured] : 0) + (a.promotion ? 800 : 0);
    const vb = (b.captured ? VALUE[b.captured] : 0) + (b.promotion ? 800 : 0);
    return vb - va;
  });
  return moves;
}

function negamax(game, depth, alpha, beta, deadline) {
  if (game.isCheckmate()) return -MATE + (10 - depth);
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) return 0;
  if (depth === 0) return evaluate(game);
  if (Date.now() > deadline) return evaluate(game);

  const moves = orderedMoves(game);
  if (!moves.length) return game.inCheck() ? -MATE + (10 - depth) : 0;

  let best = -Infinity;
  for (const m of moves) {
    game.move(m);
    const score = -negamax(game, depth - 1, -beta, -alpha, deadline);
    game.undo();
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

/**
 * 选一步。
 * opts: { depth, timeMs, randomness }
 * 返回 chess.js 的着法对象（含 from/to/promotion）。
 */
export function bestMove(fen, opts = {}) {
  const depth = opts.depth ?? 2;
  const deadline = Date.now() + (opts.timeMs ?? 1200);
  const game = new Chess(fen);
  const moves = orderedMoves(game);
  if (!moves.length) return null;
  if (depth <= 0) return moves[Math.floor(Math.random() * moves.length)];

  let best = moves[0];
  let bestScore = -Infinity;
  const noise = opts.randomness ?? 0;

  for (const m of moves) {
    game.move(m);
    const raw = -negamax(game, depth - 1, -Infinity, Infinity, deadline);
    game.undo();
    const score = raw + (noise ? (Math.random() - 0.5) * noise : 0);
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
    if (Date.now() > deadline) break;
  }
  return best;
}
