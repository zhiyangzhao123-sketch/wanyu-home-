// 扫雷的规则与盘面逻辑。
//
// 关键一条：**第一下不能踩雷**。所以地雷是在第一次点开之后才铺的，
// 而且第一下点的那格和它周围八格都不放雷。
//
// 单元格状态：{ mine: boolean, count: number, revealed: boolean, flag: boolean }

export function createBoard(cols, rows) {
  const cells = [];
  for (let i = 0; i < cols * rows; i++) {
    cells.push({ mine: false, count: 0, revealed: false, flag: false });
  }
  return { cols, rows, cells, minesPlaced: false, revealedCount: 0, boom: false };
}

export function neighbors(board, pos) {
  const { cols, rows } = board;
  const r = Math.floor(pos / cols);
  const c = pos % cols;
  const out = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr;
      const cc = c + dc;
      if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
      out.push(rr * cols + cc);
    }
  }
  return out;
}

/** 铺雷：避开 safe 及其周围。 */
export function placeMines(board, mineCount, safe, rand = Math.random) {
  const forbidden = new Set([safe, ...neighbors(board, safe)]);
  const candidates = [];
  for (let i = 0; i < board.cells.length; i++) {
    if (!forbidden.has(i)) candidates.push(i);
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const count = Math.min(mineCount, candidates.length);
  for (let i = 0; i < count; i++) board.cells[candidates[i]].mine = true;

  // 算每格周围的雷数
  for (let i = 0; i < board.cells.length; i++) {
    if (board.cells[i].mine) continue;
    let n = 0;
    for (const nb of neighbors(board, i)) if (board.cells[nb].mine) n += 1;
    board.cells[i].count = n;
  }
  board.minesPlaced = true;
  return board;
}

/**
 * 点开一格。返回 { lost, opened }。
 * 第一次点开时才铺雷。
 */
export function reveal(board, pos, mineCount, rand = Math.random) {
  if (board.cells[pos].revealed || board.cells[pos].flag) return { lost: false, opened: 0 };
  if (!board.minesPlaced) placeMines(board, mineCount, pos, rand);

  const cell = board.cells[pos];
  if (cell.mine) {
    cell.revealed = true;
    board.boom = true;
    return { lost: true, opened: 0 };
  }

  // 空白格自动摊开
  let opened = 0;
  const stack = [pos];
  while (stack.length) {
    const cur = stack.pop();
    const c = board.cells[cur];
    if (c.revealed || c.flag || c.mine) continue;
    c.revealed = true;
    opened += 1;
    board.revealedCount += 1;
    if (c.count === 0) {
      for (const nb of neighbors(board, cur)) {
        const n = board.cells[nb];
        if (!n.revealed && !n.flag && !n.mine) stack.push(nb);
      }
    }
  }
  return { lost: false, opened };
}

export function toggleFlag(board, pos) {
  const c = board.cells[pos];
  if (c.revealed) return false;
  c.flag = !c.flag;
  return c.flag;
}

export function flagCount(board) {
  return board.cells.filter((c) => c.flag).length;
}

/** 赢：所有非雷格都翻开（旗子插错不影响）。 */
export function isWin(board) {
  return board.cells.every((c) => c.mine || c.revealed);
}

/** 输的那一下过后，把所有雷亮出来。 */
export function revealAllMines(board) {
  for (const c of board.cells) if (c.mine) c.revealed = true;
}

export const LEVELS = {
  easy: { cols: 9, rows: 9, mines: 10, label: "初级" },
  medium: { cols: 12, rows: 12, mines: 22, label: "中级" },
  hard: { cols: 16, rows: 16, mines: 40, label: "高级" },
};
