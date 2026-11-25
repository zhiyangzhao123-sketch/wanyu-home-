// 斗兽棋（兽棋 / Jungle）规则引擎。
//
// 棋盘 7 列 × 9 行，index = 行 * 7 + 列，行 0 在上（蓝方），行 8 在下（红方）。
//
// 等级：象 8 > 狮 7 > 虎 6 > 豹 5 > 狼 4 > 狗 3 > 猫 2 > 鼠 1，但鼠能吃象。
// 地形：
//   · 河（第 3–5 行、第 1/2/4/5 列）：只有鼠能进；水里的鼠不吃岸上的子，岸上也吃不了水里的鼠。
//   · 狮、虎可以横竖跳河，河里有鼠就跳不过去。
//   · 陷阱：站在对方陷阱里的子等级按 0 算，谁都能吃。
//   · 兽穴：不能进自己的穴；进对方的穴直接获胜。

export const COLS = 7;
export const ROWS = 9;
export const CELLS = COLS * ROWS;

export const RED = 1;
export const BLUE = 2;

export const RANKS = {
  象: 8, 狮: 7, 虎: 6, 豹: 5, 狼: 4, 狗: 3, 猫: 2, 鼠: 1,
};

export const NAMES = Object.keys(RANKS);

export const isRed = (p) => !!p && p.side === RED;
export const sideName = (side) => (side === RED ? "红" : "蓝");

const idx = (r, c) => r * COLS + c;

export const DEN = {
  [BLUE]: idx(0, 3),
  [RED]: idx(8, 3),
};

export const TRAPS = {
  [BLUE]: [idx(0, 2), idx(0, 4), idx(1, 3)],
  [RED]: [idx(8, 2), idx(8, 4), idx(7, 3)],
};

export function isWater(pos) {
  const r = Math.floor(pos / COLS);
  const c = pos % COLS;
  if (r < 3 || r > 5) return false;
  return c === 1 || c === 2 || c === 4 || c === 5;
}

const START_RED = [
  [8, 0, "象"], [8, 6, "狮"],
  [7, 1, "豹"], [7, 5, "虎"],
  [6, 0, "鼠"], [6, 2, "猫"], [6, 4, "狗"], [6, 6, "狼"],
];

export function createGame() {
  const board = new Array(CELLS).fill(null);
  for (const [r, c, name] of START_RED) {
    board[idx(r, c)] = { side: RED, name, rank: RANKS[name] };
    board[idx(ROWS - 1 - r, COLS - 1 - c)] = { side: BLUE, name, rank: RANKS[name] };
  }
  return { board, turn: RED, winner: 0, reason: "", lastMove: -1 };
}

export function clone(state) {
  return {
    ...state,
    board: state.board.map((p) => (p ? { ...p } : null)),
  };
}

export function neighbors(pos) {
  const r = Math.floor(pos / COLS);
  const c = pos % COLS;
  const out = [];
  if (r > 0) out.push(pos - COLS);
  if (r < ROWS - 1) out.push(pos + COLS);
  if (c > 0) out.push(pos - 1);
  if (c < COLS - 1) out.push(pos + 1);
  return out;
}

/** 这个子在对方陷阱里时，等级按 0 算。 */
export function effectiveRank(piece, pos) {
  if (!piece) return -1;
  const enemyTraps = TRAPS[piece.side === RED ? BLUE : RED];
  if (enemyTraps.includes(pos)) return 0;
  return piece.rank;
}

/** 能否吃：以进攻方视角。 */
export function canCapture(attacker, from, defender, to) {
  if (!defender) return true;
  if (attacker.side === defender.side) return false;

  const aWater = isWater(from);
  const dWater = isWater(to);
  // 水里的鼠和岸上的子互不相吃
  if (aWater !== dWater) return false;

  // 鼠能吃象，象不能吃鼠
  if (attacker.name === "鼠" && defender.name === "象") return true;
  if (attacker.name === "象" && defender.name === "鼠") return false;

  const ar = effectiveRank(attacker, from);
  const dr = effectiveRank(defender, to);
  return ar >= dr;
}

/** 生成某个位置能走到的点（不含跳河的补充）。 */
function stepMoves(state, pos) {
  const piece = state.board[pos];
  const out = [];
  for (const to of neighbors(pos)) {
    const target = state.board[to];
    if (target && target.side === piece.side) continue;
    // 不能进自己的穴
    if (to === DEN[piece.side]) continue;
    // 只有鼠能进河
    if (isWater(to) && piece.name !== "鼠") continue;
    if (!canCapture(piece, pos, target, to)) continue;
    out.push(to);
  }
  return out;
}

const JUMPS = ["狮", "虎"];

/** 狮、虎跳河：横竖跨过整段河。 */
function jumpMoves(state, pos) {
  const piece = state.board[pos];
  if (!JUMPS.includes(piece.name)) return [];
  const out = [];
  const r0 = Math.floor(pos / COLS);
  const c0 = pos % COLS;

  for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    let r = r0 + dr;
    let c = c0 + dc;
    let crossed = 0;
    let blocked = false;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && isWater(idx(r, c))) {
      const cell = state.board[idx(r, c)];
      if (cell && cell.name === "鼠") blocked = true;
      crossed += 1;
      r += dr;
      c += dc;
    }
    if (!crossed || blocked) continue;
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
    const to = idx(r, c);
    const target = state.board[to];
    if (target && target.side === piece.side) continue;
    if (to === DEN[piece.side]) continue;
    if (!canCapture(piece, pos, target, to)) continue;
    out.push(to);
  }
  return out;
}

/** 某个位置的全部合法目标。 */
export function movesFrom(state, pos) {
  const piece = state.board[pos];
  if (!piece) return [];
  const set = new Set([...stepMoves(state, pos), ...jumpMoves(state, pos)]);
  return [...set];
}

export function legalMoves(state, side) {
  const out = [];
  for (let i = 0; i < CELLS; i++) {
    const p = state.board[i];
    if (!p || p.side !== side) continue;
    for (const to of movesFrom(state, i)) out.push({ from: i, to });
  }
  return out;
}

/** 走一步。 */
export function move(state, from, to) {
  const next = clone(state);
  const piece = next.board[from];
  if (!piece) return { error: "这里没有棋子" };
  if (piece.side !== state.turn) return { error: "还没轮到你" };
  if (!movesFrom(state, from).includes(to)) return { error: "这一步走不了" };

  const target = next.board[to];
  next.board[to] = piece;
  next.board[from] = null;
  next.lastMove = to;

  // 进对方兽穴即胜
  if (to === DEN[piece.side === RED ? BLUE : RED]) {
    next.winner = piece.side;
    next.reason = "进入对方兽穴";
    next.turn = state.turn;
    return next;
  }

  // 吃光对方也算胜
  const enemy = piece.side === RED ? BLUE : RED;
  const enemyLeft = next.board.some((p) => p && p.side === enemy);
  if (!enemyLeft) {
    next.winner = piece.side;
    next.reason = "吃光对方";
    return next;
  }

  next.turn = enemy;

  // 对方无子可动也算输（罕见，但要有出口）
  if (!legalMoves(next, enemy).length) {
    next.winner = piece.side;
    next.reason = "对方无子可动";
  }
  return next;
}

/** 给 AI 用的估值。 */
export function evaluate(state, side) {
  const enemy = side === RED ? BLUE : RED;
  let score = 0;
  for (let i = 0; i < CELLS; i++) {
    const p = state.board[i];
    if (!p) continue;
    const v = p.rank * 10 + (isWater(i) ? 2 : 0);
    score += p.side === side ? v : -v;
  }
  // 离对方穴越近越好
  const dist = (pos, target) => {
    const r1 = Math.floor(pos / COLS);
    const c1 = pos % COLS;
    const r2 = Math.floor(target / COLS);
    const c2 = target % COLS;
    return Math.abs(r1 - r2) + Math.abs(c1 - c2);
  };
  for (let i = 0; i < CELLS; i++) {
    const p = state.board[i];
    if (!p) continue;
    const enemyDen = DEN[p.side === side ? enemy : side];
    const d = dist(i, enemyDen);
    score += (p.side === side ? -1 : 1) * d * 0.6;
  }
  return score;
}

/** α-β 搜索选一步。 */
export function chooseMove(state, side, opts = {}) {
  const depth = opts.depth ?? 2;
  const deadline = Date.now() + (opts.timeMs ?? 900);
  const rand = opts.rand ?? Math.random;
  const moves = legalMoves(state, side);
  if (!moves.length) return null;

  function negamax(st, s, d, alpha, beta) {
    if (d === 0 || Date.now() > deadline) return evaluate(st, s);
    const ms = legalMoves(st, s);
    if (!ms.length) return -9999;
    let best = -Infinity;
    for (const m of ms) {
      const next = move(st, m.from, m.to);
      if (next.error) continue;
      if (next.winner) return 9999;
      const score = -negamax(next, s === RED ? BLUE : RED, d - 1, -beta, -alpha);
      if (score > best) best = score;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  }

  let best = moves[0];
  let bestScore = -Infinity;
  const noise = opts.randomness ?? 0;
  for (const m of moves) {
    const next = move(state, m.from, m.to);
    if (next.error) continue;
    let score;
    if (next.winner) score = 99999;
    else score = -negamax(next, side === RED ? BLUE : RED, depth - 1, -Infinity, Infinity);
    score += noise ? (rand() - 0.5) * noise : 0;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
    if (Date.now() > deadline) break;
  }
  return best;
}
