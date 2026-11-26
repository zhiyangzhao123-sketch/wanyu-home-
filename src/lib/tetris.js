// 俄罗斯方块的规则部分：七种方块、旋转、碰撞、消行、计分。
// 不碰 DOM，方便单独测。

export const COLS = 10;
export const ROWS = 20;

/** 七种方块的基础形状（用 0/1 矩阵表示）。 */
export const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
};

export const COLORS = {
  I: "#4a9ec4",
  O: "#d9b24a",
  T: "#8f6fbf",
  S: "#5fa86b",
  Z: "#c25b52",
  J: "#4f6fa8",
  L: "#cc8a4a",
};

export function emptyBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(null));
}

/** 顺时针旋转矩阵。 */
export function rotate(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const out = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out[c][rows - 1 - r] = matrix[r][c];
    }
  }
  return out;
}

/** 出现一个新方块：水平居中，顶部对齐。 */
export function spawn(kind) {
  const matrix = SHAPES[kind].map((row) => row.slice());
  return {
    kind,
    matrix,
    x: Math.floor((COLS - matrix[0].length) / 2),
    y: 0,
  };
}

/** 这个位置会不会撞墙或撞已落下的方块。 */
export function collides(board, piece, dx = 0, dy = 0, matrix = piece.matrix) {
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (!matrix[r][c]) continue;
      const x = piece.x + c + dx;
      const y = piece.y + r + dy;
      if (x < 0 || x >= COLS) return true;
      if (y >= ROWS) return true;
      if (y < 0) continue;
      if (board[y][x]) return true;
    }
  }
  return false;
}

/** 把方块固定进棋盘。 */
export function merge(board, piece) {
  const next = board.map((row) => row.slice());
  for (let r = 0; r < piece.matrix.length; r++) {
    for (let c = 0; c < piece.matrix[r].length; c++) {
      if (!piece.matrix[r][c]) continue;
      const x = piece.x + c;
      const y = piece.y + r;
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS) next[y][x] = piece.kind;
    }
  }
  return next;
}

/** 消掉满行，返回新的棋盘与消掉的行数。 */
export function clearLines(board) {
  const kept = board.filter((row) => row.some((v) => !v));
  const cleared = ROWS - kept.length;
  while (kept.length < ROWS) kept.unshift(new Array(COLS).fill(null));
  return { board: kept, cleared };
}

/** 计分：1 行 100，2 行 300，3 行 500，4 行 800，再乘等级。 */
export function scoreFor(cleared, level) {
  const base = [0, 100, 300, 500, 800][cleared] ?? 0;
  return base * Math.max(1, level);
}

/** 每消 10 行升一级；等级越高掉得越快。 */
export function levelFor(lines) {
  return 1 + Math.floor(lines / 10);
}

/** 下落间隔（毫秒）。 */
export function dropInterval(level) {
  return Math.max(90, 800 - (level - 1) * 70);
}

/** 随机取一个方块（简单的 7-bag，保证不会连着来同一个）。 */
export function makeBag(rand = Math.random) {
  const bag = Object.keys(SHAPES);
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

/** 试试能不能旋转：转不动时左右推一下（墙踢）。 */
export function tryRotate(board, piece) {
  const rotated = rotate(piece.matrix);
  for (const dx of [0, -1, 1, -2, 2]) {
    if (!collides(board, piece, dx, 0, rotated)) {
      return { ...piece, matrix: rotated, x: piece.x + dx };
    }
  }
  return null;
}

/** 硬降到底：返回落到底之后的位置。 */
export function dropTo(board, piece) {
  let y = piece.y;
  while (!collides(board, { ...piece, y }, 0, 1)) y += 1;
  return { ...piece, y };
}
