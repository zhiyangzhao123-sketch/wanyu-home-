// 9 路围棋的规则引擎：落子、提子、禁入点、打劫、数子。
// 纯函数式，不碰 DOM，方便单独测试。

export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;

export function createBoard(size = 9) {
  return {
    size,
    grid: new Array(size * size).fill(EMPTY),
    turn: BLACK,
    ko: -1, // 上一手如果提了单子，这里是禁着点
    history: [],
    passes: 0,
    captured: { [BLACK]: 0, [WHITE]: 0 },
  };
}

export function clone(state) {
  return {
    ...state,
    grid: state.grid.slice(),
    captured: { ...state.captured },
    history: state.history.slice(),
  };
}

export function neighbors(size, pos) {
  const r = Math.floor(pos / size);
  const c = pos % size;
  const out = [];
  if (r > 0) out.push(pos - size);
  if (r < size - 1) out.push(pos + size);
  if (c > 0) out.push(pos - 1);
  if (c < size - 1) out.push(pos + 1);
  return out;
}

/** 找到与 pos 同色的整块棋，以及它的气。 */
export function groupAt(grid, size, pos) {
  const color = grid[pos];
  if (!color) return { stones: new Set(), liberties: new Set() };
  const stones = new Set([pos]);
  const liberties = new Set();
  const stack = [pos];
  while (stack.length) {
    const cur = stack.pop();
    for (const nb of neighbors(size, cur)) {
      if (grid[nb] === EMPTY) liberties.add(nb);
      else if (grid[nb] === color && !stones.has(nb)) {
        stones.add(nb);
        stack.push(nb);
      }
    }
  }
  return { stones, liberties };
}

/** 只做判定，不改盘面。返回 {ok, reason}。 */
export function isLegal(state, pos) {
  const { size, grid, ko, turn } = state;
  if (pos < 0 || pos >= grid.length) return { ok: false, reason: "越界" };
  if (grid[pos] !== EMPTY) return { ok: false, reason: "这里已经有子了" };
  if (pos === ko) return { ok: false, reason: "打劫，这里不能马上提回来" };

  const trial = grid.slice();
  trial[pos] = turn;
  const enemy = turn === BLACK ? WHITE : BLACK;

  let captured = 0;
  for (const nb of neighbors(size, pos)) {
    if (trial[nb] === enemy) {
      const g = groupAt(trial, size, nb);
      if (g.liberties.size === 0) {
        for (const s of g.stones) trial[s] = EMPTY;
        captured += g.stones.size;
      }
    }
  }

  const mine = groupAt(trial, size, pos);
  if (mine.liberties.size === 0) return { ok: false, reason: "禁入点：下这里会自己没气" };
  if (captured === 0 && mine.stones.size === 1 && mine.liberties.size === 1) {
    // 自己只有一口气，可能形成打劫，交给 ko 字段处理
  }
  return { ok: true, reason: "" };
}

/** 落子。返回新的 state，或者 {error}。 */
export function play(state, pos) {
  const legal = isLegal(state, pos);
  if (!legal.ok) return { error: legal.reason };

  const next = clone(state);
  const { size, grid } = next;
  const enemy = next.turn === BLACK ? WHITE : BLACK;
  grid[pos] = next.turn;

  let captured = 0;
  for (const nb of neighbors(size, pos)) {
    if (grid[nb] === enemy) {
      const g = groupAt(grid, size, nb);
      if (g.liberties.size === 0) {
        for (const s of g.stones) grid[s] = EMPTY;
        captured += g.stones.size;
      }
    }
  }
  next.captured[next.turn] += captured;

  // 简单劫：这一手提了恰好一子，且自己这块只有一口气，就记下禁着点
  next.ko = -1;
  if (captured === 1) {
    const mine = groupAt(grid, size, pos);
    if (mine.stones.size === 1 && mine.liberties.size === 1) {
      const [lib] = [...mine.liberties];
      next.ko = lib;
    }
  }

  next.history.push(pos);
  next.passes = 0;
  next.turn = enemy;
  return next;
}

export function pass(state) {
  const next = clone(state);
  next.passes += 1;
  next.ko = -1;
  next.history.push(-1);
  next.turn = next.turn === BLACK ? WHITE : BLACK;
  return next;
}

/** 数子：棋子数 + 被单方围住的空点。 */
export function scoreArea(state) {
  const { size, grid } = state;
  let black = 0;
  let white = 0;
  for (const v of grid) {
    if (v === BLACK) black += 1;
    else if (v === WHITE) white += 1;
  }
  const seen = new Set();
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] !== EMPTY || seen.has(i)) continue;
    const region = [];
    const borders = new Set();
    const stack = [i];
    seen.add(i);
    while (stack.length) {
      const cur = stack.pop();
      region.push(cur);
      for (const nb of neighbors(size, cur)) {
        if (grid[nb] === EMPTY && !seen.has(nb)) {
          seen.add(nb);
          stack.push(nb);
        } else if (grid[nb] !== EMPTY) {
          borders.add(grid[nb]);
        }
      }
    }
    if (borders.size === 1) {
      if (borders.has(BLACK)) black += region.length;
      else white += region.length;
    }
  }
  return { black, white };
}

/** 自己的一只眼：四邻全是自己（或边），填上去等于自尽。 */
export function isOwnEye(state, pos, color) {
  const { size, grid } = state;
  if (grid[pos] !== EMPTY) return false;
  const nbs = neighbors(size, pos);
  for (const nb of nbs) {
    if (grid[nb] !== color && grid[nb] !== EMPTY) return false;
    if (grid[nb] === EMPTY && !isTrueEyePoint(state, nb, color)) {
      // 邻点也是空，只有在角上才可能是真眼，简化处理：不算
      return false;
    }
  }
  return true;
}

function isTrueEyePoint(state, pos, color) {
  const { size, grid } = state;
  if (grid[pos] !== EMPTY) return false;
  for (const nb of neighbors(size, pos)) {
    if (grid[nb] !== color) return false;
  }
  return true;
}

/**
 * 选一手棋。不追求棋力，只求“像在下一盘围棋”：
 * 能提就提、能打吃就打吃、别填自己的眼、别一上来就啃一线。
 * 用启发式打分，几百次浮点运算就够，手机上也不会卡。
 */
export function chooseMove(state, rand = Math.random) {
  const { size, grid, turn } = state;
  const enemy = turn === BLACK ? WHITE : BLACK;
  const center = (size - 1) / 2;
  let best = null;
  let bestScore = -Infinity;

  for (let pos = 0; pos < grid.length; pos++) {
    if (grid[pos] !== EMPTY) continue;
    const legal = isLegal(state, pos);
    if (!legal.ok) continue;
    if (isOwnEye(state, pos, turn)) continue;

    const trial = grid.slice();
    trial[pos] = turn;
    let captured = 0;
    let atari = 0;
    for (const nb of neighbors(size, pos)) {
      if (trial[nb] === enemy) {
        const g = groupAt(trial, size, nb);
        // 上一步已经提掉的子会变空，这里用原盘判断是否被打吃
        const before = groupAt(grid, size, nb);
        if (before.liberties.size === 2) atari += 1;
      }
    }
    // 真正提子数
    const after = groupAt(trial, size, pos);
    const ownLibs = after.liberties.size;

    for (const nb of neighbors(size, pos)) {
      if (grid[nb] === enemy) {
        const g = groupAt(grid, size, nb);
        if (g.liberties.size === 1) captured += g.stones.size;
      }
    }

    const r = Math.floor(pos / size);
    const c = pos % size;
    const edgePenalty = r === 0 || c === 0 || r === size - 1 || c === size - 1 ? -2.5 : 0;
    const centerBonus = -(Math.abs(r - center) + Math.abs(c - center)) * 0.35;

    let contact = 0;
    let ownContact = 0;
    for (const nb of neighbors(size, pos)) {
      if (grid[nb] === enemy) contact += 1;
      else if (grid[nb] === turn) ownContact += 1;
    }

    const score =
      captured * 18 +
      atari * 5 +
      Math.min(ownLibs, 5) * 1.2 +
      contact * 1.4 +
      ownContact * 0.8 +
      centerBonus +
      edgePenalty +
      rand() * 0.6;

    if (score > bestScore) {
      bestScore = score;
      best = pos;
    }
  }
  return best;
}
