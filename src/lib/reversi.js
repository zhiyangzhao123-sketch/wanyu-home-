// 黑白棋（Reversi / Othello）规则引擎。
//
// 8×8 棋盘，index = 行 * 8 + 列，行 0 在上。
// 0 空、1 黑、2 白。黑先。
//
// 规则只有三条：落子必须夹住对方的子；被夹的翻面；两边都没得下就结束。
// 难点全在“一路夹到底”的判定和“没得下要过手”。

export const SIZE = 8;
export const CELLS = SIZE * SIZE;
export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;

export const DIRS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

/** 标准开局：黑 (3,3)(4,4)，白 (3,4)(4,3)。黑先。 */
export function createGame() {
  const board = new Array(CELLS).fill(EMPTY);
  board[3 * SIZE + 3] = BLACK;
  board[4 * SIZE + 4] = BLACK;
  board[3 * SIZE + 4] = WHITE;
  board[4 * SIZE + 3] = WHITE;
  return {
    board,
    turn: BLACK,
    over: false,
    passed: false, // 上一手是否是过手
    lastMove: -1,
  };
}

export function clone(state) {
  return { ...state, board: state.board.slice() };
}

export function opponent(side) {
  return side === BLACK ? WHITE : BLACK;
}

/** 从 pos 沿 (dr,dc) 能夹住的子；返回要翻的位置，没有则空数组。 */
function flanked(board, pos, side, dr, dc) {
  const r0 = Math.floor(pos / SIZE);
  const c0 = pos % SIZE;
  const enemy = opponent(side);
  const out = [];
  let r = r0 + dr;
  let c = c0 + dc;
  while (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
    const v = board[r * SIZE + c];
    if (v === enemy) {
      out.push(r * SIZE + c);
    } else if (v === side) {
      return out.length ? out : [];
    } else {
      return [];
    }
    r += dr;
    c += dc;
  }
  return [];
}

/** 这一手能翻哪些子（空数组表示不合法）。 */
export function flipsFor(board, pos, side) {
  if (board[pos] !== EMPTY) return [];
  const all = [];
  for (const [dr, dc] of DIRS) {
    all.push(...flanked(board, pos, side, dr, dc));
  }
  return all;
}

export function legalMoves(state, side = state.turn) {
  const out = [];
  for (let i = 0; i < CELLS; i++) {
    if (state.board[i] !== EMPTY) continue;
    if (flipsFor(state.board, i, side).length) out.push(i);
  }
  return out;
}

/** 落子。返回新状态，或 { error }。 */
export function play(state, pos) {
  if (state.over) return { error: "已经结束了" };
  const flips = flipsFor(state.board, pos, state.turn);
  if (!flips.length) return { error: "这里放不了子" };

  const next = clone(state);
  next.board[pos] = state.turn;
  for (const f of flips) next.board[f] = state.turn;
  next.lastMove = pos;

  // 换手；对手没得下则过手，自己也过不了就结束
  let turn = opponent(state.turn);
  let passed = false;
  if (!legalMoves({ board: next.board }, turn).length) {
    if (!legalMoves({ board: next.board }, state.turn).length) {
      next.over = true;
      next.turn = turn;
      next.passed = false;
      return next;
    }
    passed = true;
    turn = state.turn;
  }
  next.turn = turn;
  next.passed = passed;
  return next;
}

/** 主动过手（只有真的没得下时才允许）。 */
export function pass(state) {
  const next = clone(state);
  const other = opponent(state.turn);
  if (!legalMoves({ board: next.board }, other).length) {
    next.over = true;
  }
  next.turn = other;
  next.passed = true;
  return next;
}

export function counts(board) {
  let black = 0;
  let white = 0;
  for (const v of board) {
    if (v === BLACK) black += 1;
    else if (v === WHITE) white += 1;
  }
  return { black, white };
}

export function winner(state) {
  const { black, white } = counts(state.board);
  if (!state.over) return 0;
  if (black > white) return BLACK;
  if (white > black) return WHITE;
  return -1; // 平局
}

// ---------- 估值与搜索 ----------

// 经典格子权重：角最好，角旁边的 X 位最差
const WEIGHTS = [
  100, -20, 10, 5, 5, 10, -20, 100,
  -20, -50, -2, -2, -2, -2, -50, -20,
  10, -2, 1, 1, 1, 1, -2, 10,
  5, -2, 1, 1, 1, 1, -2, 5,
  5, -2, 1, 1, 1, 1, -2, 5,
  10, -2, 1, 1, 1, 1, -2, 10,
  -20, -50, -2, -2, -2, -2, -50, -20,
  100, -20, 10, 5, 5, 10, -20, 100,
];

/** 从 side 视角给盘面打分。 */
export function evaluate(board, side) {
  let pos = 0;
  let mine = 0;
  let theirs = 0;
  for (let i = 0; i < CELLS; i++) {
    const v = board[i];
    if (v === side) {
      pos += WEIGHTS[i];
      mine += 1;
    } else if (v !== EMPTY) {
      pos -= WEIGHTS[i];
      theirs += 1;
    }
  }
  const discDiff = mine - theirs;
  // 中盘看位置，末盘看子数
  const empties = CELLS - mine - theirs;
  const phase = empties > 16 ? 1 : 0;
  const mobility =
    legalMoves({ board }, side).length - legalMoves({ board }, side === BLACK ? WHITE : BLACK).length;
  return pos * (phase ? 1 : 0.35) + discDiff * (phase ? 0.6 : 6) + mobility * (phase ? 6 : 2);
}

function applyOn(board, pos, side) {
  const flips = flipsFor(board, pos, side);
  if (!flips.length) return null;
  const next = board.slice();
  next[pos] = side;
  for (const f of flips) next[f] = side;
  return next;
}

function negamax(board, side, depth, alpha, beta, deadline) {
  const moves = legalMoves({ board }, side);
  if (!moves.length) {
    const other = legalMoves({ board }, side === BLACK ? WHITE : BLACK);
    if (!other.length) {
      const { black, white } = counts(board);
      const diff = side === BLACK ? black - white : white - black;
      return diff > 0 ? 10000 + diff : diff < 0 ? -10000 + diff : 0;
    }
    return -negamax(board, side === BLACK ? WHITE : BLACK, depth, -beta, -alpha, deadline);
  }
  if (depth <= 0 || Date.now() > deadline) return evaluate(board, side);

  // 先试角上和权重高的点，剪枝更狠
  moves.sort((a, b) => WEIGHTS[b] - WEIGHTS[a]);

  let best = -Infinity;
  for (const m of moves) {
    const next = applyOn(board, m, side);
    if (!next) continue;
    const score = -negamax(next, side === BLACK ? WHITE : BLACK, depth - 1, -beta, -alpha, deadline);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

/**
 * 选一手。返回落点；null 表示没得下（要过手）。
 * opts: { depth, timeMs, randomness }
 */
export function choose(board, side, opts = {}) {
  const depth = opts.depth ?? 4;
  const deadline = Date.now() + (opts.timeMs ?? 1200);
  const rand = opts.rand ?? Math.random;
  const moves = legalMoves({ board }, side);
  if (!moves.length) return null;

  moves.sort((a, b) => WEIGHTS[b] - WEIGHTS[a]);

  let best = moves[0];
  let bestScore = -Infinity;
  const noise = opts.randomness ?? 0;

  for (const m of moves) {
    const next = applyOn(board, m, side);
    if (!next) continue;
    const raw = -negamax(next, side === BLACK ? WHITE : BLACK, depth - 1, -Infinity, Infinity, deadline);
    const score = raw + (noise ? (rand() - 0.5) * noise : 0);
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
    if (Date.now() > deadline) break;
  }
  return best;
}
