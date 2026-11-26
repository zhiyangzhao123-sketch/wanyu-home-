// 2048 的规则：滑动、合并、生成新块、判负。
//
// 棋盘是 4×4 的一维数组（index = 行 * 4 + 列）。
// 关键规则：**一块牌一次滑动里只能合并一次**（[2,2,4] 往左应该是 [4,4]，不是 [8]）。

export const SIZE = 4;
export const CELLS = SIZE * SIZE;
export const WIN = 2048;

export function emptyBoard() {
  return new Array(CELLS).fill(0);
}

export function createGame(rand = Math.random) {
  const board = emptyBoard();
  spawn(board, rand);
  spawn(board, rand);
  return { board, score: 0, won: false, over: false };
}

export function clone(game) {
  return { ...game, board: game.board.slice() };
}

/** 在空格里随机放一个 2（九成）或 4（一成）。 */
export function spawn(board, rand = Math.random) {
  const free = [];
  for (let i = 0; i < board.length; i++) if (!board[i]) free.push(i);
  if (!free.length) return -1;
  const pos = free[Math.floor(rand() * free.length)];
  board[pos] = rand() < 0.9 ? 2 : 4;
  return pos;
}

/** 一行的左移逻辑，返回新行与得分。 */
export function slideRow(row) {
  const tiles = row.filter((v) => v);
  const out = [];
  let gained = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
      const merged = tiles[i] * 2;
      out.push(merged);
      gained += merged;
      i += 1; // 跳过被合并的那块，保证一次滑动只合一次
    } else {
      out.push(tiles[i]);
    }
  }
  while (out.length < SIZE) out.push(0);
  return { row: out, gained };
}

function getRow(board, r) {
  return [board[r * SIZE], board[r * SIZE + 1], board[r * SIZE + 2], board[r * SIZE + 3]];
}

function setRow(board, r, row) {
  for (let c = 0; c < SIZE; c++) board[r * SIZE + c] = row[c];
}

function getCol(board, c) {
  return [board[c], board[SIZE + c], board[SIZE * 2 + c], board[SIZE * 3 + c]];
}

function setCol(board, c, col) {
  for (let r = 0; r < SIZE; r++) board[r * SIZE + c] = col[r];
}

/**
 * 往某个方向滑。返回 { moved, gained }。
 * dir: "left" | "right" | "up" | "down"
 */
export function slide(game, dir) {
  const board = game.board.slice();
  let gained = 0;
  let moved = false;

  for (let i = 0; i < SIZE; i++) {
    let line = dir === "left" || dir === "right" ? getRow(board, i) : getCol(board, i);
    if (dir === "right" || dir === "down") line = line.slice().reverse();

    const { row, gained: g } = slideRow(line);
    let result = row;
    if (dir === "right" || dir === "down") result = result.slice().reverse();

    if (g) gained += g;
    const before = dir === "left" || dir === "right" ? getRow(board, i) : getCol(board, i);
    if (result.some((v, idx) => v !== before[idx])) moved = true;

    if (dir === "left" || dir === "right") setRow(board, i, result);
    else setCol(board, i, result);
  }

  if (!moved) return { moved: false, gained: 0 };

  game.board = board;
  game.score += gained;
  if (!game.won && board.some((v) => v >= WIN)) game.won = true;
  return { moved: true, gained };
}

/** 还有没有能走的步子。 */
export function canMove(board) {
  for (let i = 0; i < board.length; i++) {
    if (!board[i]) return true;
    const r = Math.floor(i / SIZE);
    const c = i % SIZE;
    if (c + 1 < SIZE && board[i] === board[i + 1]) return true;
    if (r + 1 < SIZE && board[i] === board[i + SIZE]) return true;
  }
  return false;
}

export function isOver(board) {
  return !canMove(board);
}
