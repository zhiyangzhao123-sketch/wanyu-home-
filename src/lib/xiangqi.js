// 中国象棋规则引擎。
//
// 棋盘 9 列 × 10 行，index = 行 * 9 + 列，行 0 在上（黑方），行 9 在下（红方）。
// 棋子用数字：0 空；红 1 帅 2 仕 3 相 4 马 5 车 6 炮 7 兵；黑 9 将 10 士 11 象 12 马 13 车 14 炮 15 卒。
//
// 只做三件事：判定合法着法（含将帅照面、不能送将）、走子、估分搜索。

export const R = { K: 1, A: 2, B: 3, N: 4, R: 5, C: 6, P: 7 };
export const B = { K: 9, A: 10, B: 11, N: 12, R: 13, C: 14, P: 15 };
export const COLS = 9;
export const ROWS = 10;

export const isRed = (p) => p >= 1 && p <= 7;
export const isBlack = (p) => p >= 9 && p <= 15;
export const colorOf = (p) => (p === 0 ? 0 : p < 9 ? 1 : 2);

/** 初始局面：黑在上，红在下。 */
export function createBoard() {
  const b = new Array(90).fill(0);
  const back = [B.R, B.N, B.B, B.A, B.K, B.A, B.B, B.N, B.R];
  for (let c = 0; c < 9; c++) b[c] = back[c];
  b[2 * 9 + 1] = B.C;
  b[2 * 9 + 7] = B.C;
  for (const c of [0, 2, 4, 6, 8]) b[3 * 9 + c] = B.P;

  const rback = [R.R, R.N, R.B, R.A, R.K, R.A, R.B, R.N, R.R];
  for (let c = 0; c < 9; c++) b[9 * 9 + c] = rback[c];
  b[7 * 9 + 1] = R.C;
  b[7 * 9 + 7] = R.C;
  for (const c of [0, 2, 4, 6, 8]) b[6 * 9 + c] = R.P;
  return b;
}

const inBoard = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
const idx = (r, c) => r * 9 + c;

/** 帅/将是否在九宫内：红在 7–9 行，黑在 0–2 行，列 3–5。 */
function inPalace(r, c, side) {
  if (c < 3 || c > 5) return false;
  return side === 1 ? r >= 7 && r <= 9 : r >= 0 && r <= 2;
}

function genPiece(board, r, c, out) {
  const p = board[idx(r, c)];
  if (!p) return;
  const side = colorOf(p);
  const type = side === 1 ? p : p - 8; // 归一成 1..7

  const push = (rr, cc) => {
    if (!inBoard(rr, cc)) return false;
    const q = board[idx(rr, cc)];
    if (q && colorOf(q) === side) return false;
    out.push({ from: idx(r, c), to: idx(rr, cc) });
    return !q; // 空点可以继续走
  };

  switch (type) {
    case 1: { // 帅/将：九宫内一步
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const rr = r + dr;
        const cc = c + dc;
        if (inPalace(rr, cc, side)) push(rr, cc);
      }
      break;
    }
    case 2: { // 仕/士：九宫内斜一步
      for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const rr = r + dr;
        const cc = c + dc;
        if (inPalace(rr, cc, side)) push(rr, cc);
      }
      break;
    }
    case 3: { // 相/象：田字，塞象眼，不过河
      for (const [dr, dc] of [[2, 2], [2, -2], [-2, 2], [-2, -2]]) {
        const rr = r + dr;
        const cc = c + dc;
        if (!inBoard(rr, cc)) continue;
        if (side === 1 && rr < 5) continue; // 红相不过河
        if (side === 2 && rr > 4) continue;
        if (board[idx(r + dr / 2, c + dc / 2)]) continue; // 象眼被塞
        push(rr, cc);
      }
      break;
    }
    case 4: { // 马：日字，蹩马腿
      for (const [dr, dc] of [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]) {
        const rr = r + dr;
        const cc = c + dc;
        if (!inBoard(rr, cc)) continue;
        const legR = r + (Math.abs(dr) === 2 ? dr / 2 : 0);
        const legC = c + (Math.abs(dc) === 2 ? dc / 2 : 0);
        if (board[idx(legR, legC)]) continue;
        push(rr, cc);
      }
      break;
    }
    case 5: { // 车
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let rr = r + dr;
        let cc = c + dc;
        while (inBoard(rr, cc)) {
          const q = board[idx(rr, cc)];
          if (!q) out.push({ from: idx(r, c), to: idx(rr, cc) });
          else {
            if (colorOf(q) !== side) out.push({ from: idx(r, c), to: idx(rr, cc) });
            break;
          }
          rr += dr;
          cc += dc;
        }
      }
      break;
    }
    case 6: { // 炮：走直线，吃子要隔一个
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let rr = r + dr;
        let cc = c + dc;
        let screen = false;
        while (inBoard(rr, cc)) {
          const q = board[idx(rr, cc)];
          if (!screen) {
            if (!q) out.push({ from: idx(r, c), to: idx(rr, cc) });
            else screen = true;
          } else if (q) {
            if (colorOf(q) !== side) out.push({ from: idx(r, c), to: idx(rr, cc) });
            break;
          }
          rr += dr;
          cc += dc;
        }
      }
      break;
    }
    case 7: { // 兵/卒：向前一步，过河后可以横走
      const forward = side === 1 ? -1 : 1;
      push(r + forward, c);
      const crossed = side === 1 ? r <= 4 : r >= 5;
      if (crossed) {
        push(r, c - 1);
        push(r, c + 1);
      }
      break;
    }
    default:
      break;
  }
}

/** 生成某一方的全部“准合法”着法（不看自己会不会被将）。 */
export function genMoves(board, side) {
  const out = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[idx(r, c)];
      if (p && colorOf(p) === side) genPiece(board, r, c, out);
    }
  }
  return out;
}

/** 找某一方的帅/将位置。 */
export function findKing(board, side) {
  const king = side === 1 ? R.K : B.K;
  for (let i = 0; i < board.length; i++) if (board[i] === king) return i;
  return -1;
}

/** 某一方是否正被将军（含将帅照面）。 */
export function isChecked(board, side) {
  const kingPos = findKing(board, side);
  if (kingPos < 0) return true;
  const kr = Math.floor(kingPos / 9);
  const kc = kingPos % 9;

  // 将帅照面：同一列、中间无子
  const enemyKing = side === 1 ? B.K : R.K;
  for (let r = 0; r < ROWS; r++) {
    if (board[idx(r, kc)] === enemyKing) {
      let clear = true;
      for (let rr = Math.min(r, kr) + 1; rr < Math.max(r, kr); rr++) {
        if (board[idx(rr, kc)]) {
          clear = false;
          break;
        }
      }
      if (clear) return true;
    }
  }

  const enemy = side === 1 ? 2 : 1;
  const moves = genMoves(board, enemy);
  for (const m of moves) if (m.to === kingPos) return true;
  return false;
}

/** 就地走子，返回被吃的子（用于悔棋）。 */
export function doMove(board, move) {
  const captured = board[move.to];
  board[move.to] = board[move.from];
  board[move.from] = 0;
  return captured;
}

export function undoMove(board, move, captured) {
  board[move.from] = board[move.to];
  board[move.to] = captured;
}

/** 只留下去走之后自家不被将的着法。 */
export function legalMoves(board, side) {
  const out = [];
  for (const m of genMoves(board, side)) {
    const cap = doMove(board, m);
    if (!isChecked(board, side)) out.push(m);
    undoMove(board, m, cap);
  }
  return out;
}

// ---------- 估值与搜索 ----------

const VALUE = [0, 10000, 200, 200, 400, 900, 450, 100, 0, 10000, 200, 200, 400, 900, 450, 100];

/** 兵过河后价值上升；马炮居中更有用。 */
function positional(p, r, c) {
  const side = colorOf(p);
  const type = side === 1 ? p : p - 8;
  let v = 0;
  if (type === 7) {
    // 兵：越往前（红往上、黑往下）越值钱
    const advanced = side === 1 ? 9 - r : r;
    v += advanced * 6;
    if (c >= 3 && c <= 5) v += 10;
  } else if (type === 4 || type === 6) {
    // 马、炮：靠中略好
    v += (4 - Math.abs(c - 4)) * 4;
  }
  return v;
}

/** 从某一方看的分值（正数表示该方占优）。 */
export function evaluate(board, side) {
  let score = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[idx(r, c)];
      if (!p) continue;
      const v = VALUE[p] + positional(p, r, c);
      score += colorOf(p) === side ? v : -v;
    }
  }
  return score;
}

const MATE = 50000;

function orderedMoves(board, side) {
  const moves = legalMoves(board, side);
  // 先试吃子大的，剪枝更有效
  moves.sort((a, b) => (board[b.to] ? VALUE[board[b.to]] : 0) - (board[a.to] ? VALUE[board[a.to]] : 0));
  return moves;
}

/** 静态搜索：只接着算吃子，避免“贪吃假象”（看到吃子却看不到反吃）。 */
function quiesce(board, side, alpha, beta, left, deadline) {
  if (Date.now() > deadline) return evaluate(board, side);
  const stand = evaluate(board, side);
  if (left <= 0) return stand;
  if (stand >= beta) return beta;
  if (stand > alpha) alpha = stand;

  const caps = legalMoves(board, side).filter((m) => board[m.to] !== 0);
  caps.sort((a, b) => VALUE[board[b.to]] - VALUE[board[a.to]]);
  for (const m of caps) {
    const cap = doMove(board, m);
    const sc = -quiesce(board, side === 1 ? 2 : 1, -beta, -alpha, left - 1, deadline);
    undoMove(board, m, cap);
    if (sc >= beta) return beta;
    if (sc > alpha) alpha = sc;
  }
  return alpha;
}

function negamax(board, side, depth, alpha, beta, deadline) {
  if (depth === 0) return quiesce(board, side, alpha, beta, 3, deadline);
  if (Date.now() > deadline) return evaluate(board, side);

  const moves = orderedMoves(board, side);
  if (!moves.length) return -MATE + (10 - depth); // 无棋可走等于输（象棋规则）

  let best = -Infinity;
  for (const m of moves) {
    const cap = doMove(board, m);
    const score = -negamax(board, side === 1 ? 2 : 1, depth - 1, -beta, -alpha, deadline);
    undoMove(board, m, cap);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

/**
 * 选一手。
 * opts: { depth, timeMs?, randomness? }
 * 返回 move 或 null。
 */
export function bestMove(board, side, opts = {}) {
  const depth = opts.depth ?? 2;
  const deadline = Date.now() + (opts.timeMs ?? 1200);
  const moves = orderedMoves(board, side);
  if (!moves.length) return null;
  if (depth <= 0) return moves[0];

  let best = moves[0];
  let bestScore = -Infinity;
  const noise = opts.randomness ?? 0;

  for (const m of moves) {
    const cap = doMove(board, m);
    const raw = -negamax(board, side === 1 ? 2 : 1, depth - 1, -Infinity, Infinity, deadline);
    undoMove(board, m, cap);
    const score = raw + (noise ? (Math.random() - 0.5) * noise : 0);
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
    if (Date.now() > deadline) break;
  }
  return best;
}
