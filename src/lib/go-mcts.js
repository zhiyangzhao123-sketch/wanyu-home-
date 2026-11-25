// 围棋的蒙特卡洛树搜索（MCTS）。
//
// 思路：从当前局面出发，随机又快地下完很多盘，看哪一手赢得多。
// 随机不是纯随机——落子时优先提子、避免送吃、不填自己的眼，这样几百盘里
// 才有一点棋感，否则全是废局。
//
// 为了快，这里不复用 go-engine 的对象式状态：模拟用 Uint8Array + 就地提子。

const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

export function makeWindow(size, radius = 2) {
  const table = new Array(size * size);
  for (let pos = 0; pos < size * size; pos++) {
    const r0 = Math.floor(pos / size);
    const c0 = pos % size;
    const out = [];
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (!dr && !dc) continue;
        const r = r0 + dr;
        const c = c0 + dc;
        if (r < 0 || c < 0 || r >= size || c >= size) continue;
        out.push(r * size + c);
      }
    }
    table[pos] = out;
  }
  return table;
}

const windowCache = new Map();

export function windowFor(size) {
  let w = windowCache.get(size);
  if (!w) {
    w = makeWindow(size, 2);
    windowCache.set(size, w);
  }
  return w;
}

export function makeNeighbors(size) {
  const table = new Array(size * size);
  for (let pos = 0; pos < size * size; pos++) {
    const r = Math.floor(pos / size);
    const c = pos % size;
    const out = [];
    if (r > 0) out.push(pos - size);
    if (r < size - 1) out.push(pos + size);
    if (c > 0) out.push(pos - 1);
    if (c < size - 1) out.push(pos + 1);
    table[pos] = out;
  }
  return table;
}

/**
 * 就地落子，返回被提的子数；自杀返回 -1。
 * g 会被直接修改（提掉的子被清空）。
 */
export function place(g, nbrs, pos, color) {
  const captured = [];
  g[pos] = color;
  const enemy = color === BLACK ? WHITE : BLACK;

  for (const nb of nbrs[pos]) {
    if (g[nb] !== enemy) continue;
    const group = collect(g, nbrs, nb, enemy);
    if (group.liberties === 0) {
      for (const s of group.stones) {
        g[s] = EMPTY;
        captured.push(s);
      }
    }
  }

  const mine = collect(g, nbrs, pos, color);
  if (mine.liberties === 0 && captured.length === 0) {
    g[pos] = EMPTY;
    return -1;
  }
  return captured.length;
}

// 棋盘最大 19×19，这里按 361 预分配，避免每次收集都新建 Set（那是主要开销）
const MAX_POINTS = 19 * 19;
const stoneMark = new Int32Array(MAX_POINTS);
const libMark = new Int32Array(MAX_POINTS);
const stoneBuf = new Int32Array(MAX_POINTS);
let stamp = 0;

/** 迭代式收集同色连通块，返回棋子位置与气数（用标记数组代替 Set）。 */
export function collect(g, nbrs, start, color) {
  stamp += 1;
  if (stamp > 1_000_000) {
    stoneMark.fill(0);
    libMark.fill(0);
    stamp = 1;
  }
  const mine = stamp;
  const libs = mine + 500_000;

  let top = 0;
  let liberties = 0;
  stoneBuf[top++] = start;
  stoneMark[start] = mine;
  const stack = [start];

  while (stack.length) {
    const cur = stack.pop();
    for (const nb of nbrs[cur]) {
      const v = g[nb];
      if (v === EMPTY) {
        if (libMark[nb] !== libs) {
          libMark[nb] = libs;
          liberties += 1;
        }
      } else if (v === color && stoneMark[nb] !== mine) {
        stoneMark[nb] = mine;
        stoneBuf[top++] = nb;
        stack.push(nb);
      }
    }
  }

  return { stones: Array.prototype.slice.call(stoneBuf, 0, top), liberties };
}

/** 一个点是不是自己的一只眼（四邻全是自己）。 */
function isEye(g, nbrs, pos, color) {
  for (const nb of nbrs[pos]) {
    if (g[nb] !== color) return false;
  }
  return true;
}

/** 这一手会不会把自己下成只剩一口气（送吃）。 */
function isSelfAtari(g, nbrs, pos, color) {
  g[pos] = color;
  const enemy = color === BLACK ? WHITE : BLACK;
  let captured = 0;
  for (const nb of nbrs[pos]) {
    if (g[nb] === enemy) {
      const grp = collect(g, nbrs, nb, enemy);
      if (grp.liberties === 0) captured += grp.stones.length;
    }
  }
  const mine = collect(g, nbrs, pos, color);
  g[pos] = EMPTY;
  return mine.liberties === 1 && captured === 0;
}

/** 模拟里的一手：从空点里抽样，能提就提，避开送吃和眼位，其余随机。 */
function policyMove(g, nbrs, color, rand, lastMove, window) {
  const empties = [];
  for (let i = 0; i < g.length; i++) if (g[i] === EMPTY) empties.push(i);
  if (!empties.length) return -1;

  const enemy = color === BLACK ? WHITE : BLACK;

  // 抽样：大部分时候只看最后一手附近，这样模拟才像有来有回
  const picks = [];
  const local = lastMove >= 0 && window ? window[lastMove] : null;
  if (local && rand() < 0.7) {
    for (const pos of local) if (g[pos] === EMPTY) picks.push(pos);
  }
  const SAMPLE = 16;
  for (let k = 0; k < SAMPLE; k++) {
    picks.push(empties[Math.floor(rand() * empties.length)]);
  }

  // 1) 能提子就提
  for (const pos of picks) {
    for (const nb of nbrs[pos]) {
      if (g[nb] === enemy) {
        const grp = collect(g, nbrs, nb, enemy);
        if (grp.liberties === 1) return pos;
      }
    }
  }

  // 2) 正常候选：非眼、非送吃
  const safe = [];
  for (const pos of picks) {
    if (isEye(g, nbrs, pos, color)) continue;
    if (isSelfAtari(g, nbrs, pos, color)) continue;
    safe.push(pos);
  }
  if (safe.length) return safe[Math.floor(rand() * safe.length)];

  // 3) 抽样都不行，才退回全盘找一个不是眼的空点
  for (const pos of empties) {
    if (!isEye(g, nbrs, pos, color)) return pos;
  }
  return -1;
}

/** 数子（面积计法）：子 + 单方围住的空，返回黑减白。 */
export function areaScore(g, size) {
  let black = 0;
  let white = 0;
  for (let i = 0; i < g.length; i++) {
    if (g[i] === BLACK) black += 1;
    else if (g[i] === WHITE) white += 1;
  }
  const seen = new Uint8Array(g.length);
  for (let i = 0; i < g.length; i++) {
    if (g[i] !== EMPTY || seen[i]) continue;
    let region = 0;
    const borders = new Set();
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const cur = stack.pop();
      region += 1;
      const r = Math.floor(cur / size);
      const c = cur % size;
      const near = [];
      if (r > 0) near.push(cur - size);
      if (r < size - 1) near.push(cur + size);
      if (c > 0) near.push(cur - 1);
      if (c < size - 1) near.push(cur + 1);
      for (const nb of near) {
        if (g[nb] === EMPTY) {
          if (!seen[nb]) {
            seen[nb] = 1;
            stack.push(nb);
          }
        } else borders.add(g[nb]);
      }
    }
    if (borders.size === 1) {
      if (borders.has(BLACK)) black += region;
      else white += region;
    }
  }
  return black - white;
}

/** 从 startGrid 出发跑一盘到底，返回黑减白的目差。 */
export function runPlayout(startGrid, size, toMove, rand, nbrs, lastMove = -1) {
  const g = startGrid.slice();
  const window = windowFor(size);
  let turn = toMove;
  let passes = 0;
  let last = lastMove;
  const limit = size * size * 2;
  for (let m = 0; m < limit && passes < 2; m++) {
    const pos = policyMove(g, nbrs, turn, rand, last, window);
    if (pos < 0 || place(g, nbrs, pos, turn) < 0) {
      passes += 1;
      turn = turn === BLACK ? WHITE : BLACK;
      continue;
    }
    passes = 0;
    last = pos;
    turn = turn === BLACK ? WHITE : BLACK;
  }
  return areaScore(g, size);
}

/**
 * 用 MCTS 选一手。
 * opts: { playouts, timeMs?, rand?, candidates? }
 *   candidates 给定时只用这些点（通常来自启发式的前 N 手），搜索才有意义。
 * 返回落点；-1 表示建议停一手；null 表示没算出来。
 */
export async function chooseMoveMCTS(startGrid, size, toMove, opts) {
  const rand = opts.rand ?? Math.random;
  const nbrs = makeNeighbors(size);
  const deadline = opts.timeMs ? Date.now() + opts.timeMs : Infinity;
  const rootGrid = startGrid.slice();
  const enemy = toMove === BLACK ? WHITE : BLACK;

  // 候选点：优先用传入的（启发式筛选过的），否则退回“附近两格有子”的空点
  const candidates = [];
  if (opts.candidates && opts.candidates.length) {
    for (const pos of opts.candidates) {
      if (rootGrid[pos] === EMPTY) candidates.push(pos);
    }
  }
  if (!candidates.length) {
    for (let i = 0; i < rootGrid.length; i++) {
      if (rootGrid[i] !== EMPTY) continue;
      const r = Math.floor(i / size);
      const c = i % size;
      let near = false;
      for (let dr = -2; dr <= 2 && !near; dr++) {
        for (let dc = -2; dc <= 2 && !near; dc++) {
          const rr = r + dr;
          const cc = c + dc;
          if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
          if (rootGrid[rr * size + cc] !== EMPTY) near = true;
        }
      }
      if (near || i === Math.floor((size * size) / 2)) candidates.push(i);
    }
  }
  if (!candidates.length) return null;

  const stats = candidates.map((pos) => ({ pos, visits: 0, wins: 0, illegal: false }));
  let total = 0;
  let chunk = 0;

  for (let p = 0; p < opts.playouts; p++) {
    if (Date.now() > deadline) break;

    let pick = null;
    let bestScore = -Infinity;
    for (const s of stats) {
      if (s.illegal) continue;
      const ucb =
        s.visits === 0
          ? 1e6
          : s.wins / s.visits + 0.9 * Math.sqrt(Math.log(total + 1) / s.visits);
      if (ucb > bestScore) {
        bestScore = ucb;
        pick = s;
      }
    }
    if (!pick) break;

    const g = rootGrid.slice();
    if (place(g, nbrs, pick.pos, toMove) < 0) {
      pick.illegal = true;
      continue;
    }
    const diff = runPlayout(g, size, enemy, rand, nbrs, pick.pos);
    const win = toMove === BLACK ? diff > 0 : diff < 0;
    pick.visits += 1;
    pick.wins += win ? 1 : 0;
    total += 1;

    if (++chunk >= 40) {
      chunk = 0;
      await new Promise((r) => setTimeout(r, 0));
      if (Date.now() > deadline) break;
    }
  }

  let best = null;
  let bestRate = -1;
  let visited = false;
  for (const s of stats) {
    if (!s.visits) continue;
    visited = true;
    const rate = s.wins / s.visits;
    if (rate > bestRate) {
      bestRate = rate;
      best = s.pos;
    }
  }
  if (!visited) return null;
  if (bestRate < 0.12 && total > 60) return -1;
  return best;
}
