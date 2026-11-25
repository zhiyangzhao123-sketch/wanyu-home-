// 军棋（翻棋／暗棋）规则引擎。
//
// 棋盘 5 列 × 12 行 = 60 格，双方各 25 枚、共 50 枚，开局全部扣着。
// 每回合二选一：翻开一枚未知棋，或让自己一枚明棋走一格（正交）。
//
// 兵种等级：司令 9 > 军长 8 > 师长 7 > 旅长 6 > 团长 5 > 营长 4 > 连长 3 > 排长 2 > 工兵 1
// 特殊：炸弹与任何子同归于尽；地雷不动，只有工兵能挖，其余碰它阵亡；军旗不动，被吃即负。

export const COLS = 5;
export const ROWS = 12;
export const CELLS = COLS * ROWS;

export const SIDE_RED = 1;
export const SIDE_BLUE = 2;

// 兵种定义：等级、每方数量、可否移动
export const KINDS = {
  司令: { rank: 9, count: 1, movable: true },
  军长: { rank: 8, count: 1, movable: true },
  师长: { rank: 7, count: 2, movable: true },
  旅长: { rank: 6, count: 2, movable: true },
  团长: { rank: 5, count: 2, movable: true },
  营长: { rank: 4, count: 2, movable: true },
  连长: { rank: 3, count: 3, movable: true },
  排长: { rank: 2, count: 3, movable: true },
  工兵: { rank: 1, count: 3, movable: true },
  地雷: { rank: 0, count: 3, movable: false },
  炸弹: { rank: -1, count: 2, movable: true },
  军旗: { rank: -2, count: 1, movable: false },
};

export const KIND_NAMES = Object.keys(KINDS);

/** 一枚棋子：{ side, kind, revealed } */
function piece(side, kind) {
  return { side, kind, revealed: false };
}

export function sideName(side) {
  return side === SIDE_RED ? "红" : "蓝";
}

/** 新开一局：50 枚随机铺到 60 个格子里，全部扣着。 */
export function createGame(rand = Math.random) {
  const pool = [];
  for (const side of [SIDE_RED, SIDE_BLUE]) {
    for (const kind of KIND_NAMES) {
      for (let i = 0; i < KINDS[kind].count; i++) pool.push(piece(side, kind));
    }
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const cells = [];
  for (let i = 0; i < CELLS; i++) cells.push(i);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  const board = new Array(CELLS).fill(null);
  pool.forEach((p, idx) => {
    board[cells[idx]] = p;
  });

  return {
    board,
    turn: SIDE_RED,
    winner: 0,
    reason: "",
    log: [],
  };
}

export function clone(state) {
  return {
    ...state,
    board: state.board.map((p) => (p ? { ...p } : null)),
    log: state.log.slice(),
  };
}

/** 棋盘相邻（正交）的格子。 */
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

export function isMovable(p) {
  return !!p && p.revealed && KINDS[p.kind].movable;
}

/** 某一方所有能走的目标位置：{ from, to } */
export function legalMoves(state, side) {
  const out = [];
  for (let i = 0; i < CELLS; i++) {
    const p = state.board[i];
    if (!p || p.side !== side || !isMovable(p)) continue;
    for (const to of neighbors(i)) {
      const target = state.board[to];
      if (target && target.side === side) continue; // 不能吃自己
      if (target && !target.revealed) continue;    // 扣着的子不能碰
      out.push({ from: i, to });
    }
  }
  return out;
}

/** 翻棋：任意扣着的棋子都可以翻。 */
export function legalFlips(state) {
  const out = [];
  for (let i = 0; i < CELLS; i++) {
    const p = state.board[i];
    if (p && !p.revealed) out.push(i);
  }
  return out;
}

/**
 * 交战结果：返回 'win' | 'lose' | 'both' | 'flag'
 * 以进攻方视角。
 */
export function combat(attacker, defender) {
  const a = attacker.kind;
  const d = defender.kind;

  if (d === "军旗") return "flag";
  if (a === "炸弹" || d === "炸弹") return "both";
  if (d === "地雷") return a === "工兵" ? "win" : "lose";
  if (a === "地雷") return "lose"; // 地雷本来不能动，兜底

  const ra = KINDS[a].rank;
  const rd = KINDS[d].rank;
  if (ra > rd) return "win";
  if (ra < rd) return "lose";
  return "both";
}

/** 翻开一枚棋子。 */
export function flip(state, pos) {
  const next = clone(state);
  const p = next.board[pos];
  if (!p || p.revealed) return { error: "这里没有扣着的棋子" };
  p.revealed = true;
  next.log.push({ type: "flip", side: state.turn, pos, kind: p.kind, owner: p.side });
  next.turn = state.turn === SIDE_RED ? SIDE_BLUE : SIDE_RED;
  return next;
}

/** 走一步（可能发生交战）。 */
export function move(state, from, to) {
  const next = clone(state);
  const p = next.board[from];
  if (!p) return { error: "这里没有棋子" };
  if (!isMovable(p)) return { error: "这枚棋子不能动" };
  if (p.side !== state.turn) return { error: "还没轮到你" };
  if (!neighbors(from).includes(to)) return { error: "只能走一步" };

  const target = next.board[to];
  if (target && target.side === p.side) return { error: "不能吃自己的子" };

  let result = "move";
  if (!target) {
    next.board[to] = p;
    next.board[from] = null;
  } else if (!target.revealed) {
    // 翻棋里不该出现：碰到的子一定是明的
    return { error: "对方棋子还没翻开" };
  } else {
    const outcome = combat(p, target);
    result = outcome;
    if (outcome === "win") {
      next.board[to] = p;
      next.board[from] = null;
    } else if (outcome === "lose") {
      next.board[from] = null;
    } else if (outcome === "both") {
      next.board[from] = null;
      next.board[to] = null;
    } else if (outcome === "flag") {
      next.board[to] = p;
      next.board[from] = null;
      next.winner = p.side;
      next.reason = "吃掉军旗";
    }
  }

  next.log.push({ type: "move", side: state.turn, from, to, result });

  // 判负：一方没有军旗了，或者没有能动的子且没得翻
  if (!next.winner) {
    const loser = state.turn === SIDE_RED ? SIDE_BLUE : SIDE_RED;
    const hasFlag = next.board.some((q) => q && q.side === loser && q.kind === "军旗");
    if (!hasFlag) {
      next.winner = state.turn;
      next.reason = "对方军旗被吃";
    }
  }

  next.turn = state.turn === SIDE_RED ? SIDE_BLUE : SIDE_RED;

  if (!next.winner) {
    const canMove = legalMoves(next, next.turn).length > 0;
    const canFlip = legalFlips(next).length > 0;
    if (!canMove && !canFlip) {
      next.winner = next.turn === SIDE_RED ? SIDE_BLUE : SIDE_RED;
      next.reason = "对方无子可动";
    }
  }

  return next;
}

/** 为 AI 估算一枚棋子的价值。 */
export function pieceValue(kind) {
  const map = {
    司令: 100, 军长: 80, 师长: 55, 旅长: 42, 团长: 32, 营长: 24,
    连长: 16, 排长: 10, 工兵: 8, 地雷: 12, 炸弹: 30, 军旗: 200,
  };
  return map[kind] ?? 10;
}

/**
 * 选一步：翻棋还是走子。
 * 等级越高，越会算“这一步值不值”。
 */
export function chooseAction(state, side, opts = {}) {
  const level = opts.level ?? 1; // 0 简单 / 1 普通 / 2 困难
  const rand = opts.rand ?? Math.random;
  const moves = legalMoves(state, side);
  const flips = legalFlips(state);

  // 平均一枚未知棋子的价值，用来估算翻棋收益
  const unknown = state.board.filter((p) => p && !p.revealed);
  const avgUnknown = unknown.length
    ? unknown.reduce((s, p) => s + pieceValue(p.kind), 0) / unknown.length
    : 0;

  const options = [];

  for (const mv of moves) {
    const target = state.board[mv.to];
    const me = state.board[mv.from];
    let score = 0;
    if (!target) {
      score = 0.5;
    } else {
      const outcome = combat(me, target);
      const mine = pieceValue(me.kind);
      const theirs = pieceValue(target.kind);
      if (outcome === "win") score = theirs + 4;
      else if (outcome === "lose") score = -mine;
      else if (outcome === "both") score = theirs - mine;
      else if (outcome === "flag") score = 1000;
    }

    // 困难档：看看这一步会不会送到对方嘴边
    if (level >= 2 && score <= 0.5) {
      let danger = 0;
      for (const nb of neighbors(mv.to)) {
        const enemy = state.board[nb];
        if (!enemy || enemy.side === side || !enemy.revealed) continue;
        const back = combat(enemy, me);
        if (back === "win") danger += pieceValue(me.kind) * 0.8;
        else if (back === "both") danger += pieceValue(me.kind) * 0.3;
      }
      score -= danger;
    }

    options.push({ type: "move", from: mv.from, to: mv.to, score });
  }

  for (const pos of flips) {
    // 翻开有信息价值；简单档几乎乱翻
    let score = level === 0 ? rand() * 20 : avgUnknown * 0.12 + 1;
    options.push({ type: "flip", pos, score });
  }

  if (!options.length) return null;

  if (level === 0) {
    return options[Math.floor(rand() * options.length)];
  }

  options.sort((a, b) => b.score - a.score);
  const noise = level === 1 ? 12 : 3;
  const top = options.slice(0, Math.min(4, options.length));
  const pick = top[Math.floor(rand() * top.length)];
  // 加一点随机，避免每局走成一样
  return rand() * noise > 6 ? pick : options[0];
}
