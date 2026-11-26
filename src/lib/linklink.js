// 连连看：棋盘生成、连线判定、可解性。
//
// 规则：两个相同的图案，如果中间路径（只走空格）拐弯不超过两处，就能消掉。
// 路径可以绕到棋盘外一圈。
//
// 生成时留出空格当通道，并保证开局至少 MIN_MOVES 对能连——满盘时几乎连不上，
// 这是这个游戏最容易做砸的地方。

export const MIN_MOVES = 6;

export function createBoard(cols, rows, logos, rand = Math.random) {
  const total = cols * rows;
  const pairCount = Math.floor((total - Math.max(4, Math.round(total * 0.2))) / 2);
  const pairLogos = [];
  for (let i = 0; i < pairCount; i++) pairLogos.push(logos[i % logos.length]);

  const tiles = [];
  for (const logo of pairLogos) tiles.push(logo, logo);
  shuffle(tiles, rand);

  const cells = [];
  for (let i = 0; i < cols * rows; i++) cells.push(i);
  shuffle(cells, rand);

  const grid = new Array(cols * rows).fill(null);
  tiles.forEach((t, idx) => {
    grid[cells[idx]] = t;
  });

  const board = { grid, cols, rows };

  // 保证有得玩
  for (let attempt = 0; attempt < 200 && countMoves(board) < MIN_MOVES; attempt++) {
    reshuffle(board, rand);
  }
  return board;
}

export function shuffle(arr, rand = Math.random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 只打乱现有牌的位置，不动空格。 */
export function reshuffle(board, rand = Math.random) {
  const occupied = [];
  const values = [];
  for (let i = 0; i < board.grid.length; i++) {
    if (board.grid[i]) {
      occupied.push(i);
      values.push(board.grid[i]);
    }
  }
  shuffle(values, rand);
  occupied.forEach((pos, i) => {
    board.grid[pos] = values[i];
  });
}

export function emptyAt(board, r, c) {
  if (r < 0 || r >= board.rows || c < 0 || c >= board.cols) return true; // 外圈算空
  return board.grid[r * board.cols + c] === null;
}

function clearLine(board, r1, c1, r2, c2) {
  if (r1 === r2) {
    const [from, to] = c1 < c2 ? [c1, c2] : [c2, c1];
    for (let c = from + 1; c < to; c++) if (!emptyAt(board, r1, c)) return false;
    return true;
  }
  if (c1 === c2) {
    const [from, to] = r1 < r2 ? [r1, r2] : [r2, r1];
    for (let r = from + 1; r < to; r++) if (!emptyAt(board, r, c1)) return false;
    return true;
  }
  return false;
}

/** 两点能否用不超过两个拐弯的空路连起来。 */
export function canLink(board, a, b) {
  if (a === b) return false;
  const ar = Math.floor(a / board.cols);
  const ac = a % board.cols;
  const br = Math.floor(b / board.cols);
  const bc = b % board.cols;
  if (board.grid[a] !== board.grid[b] || !board.grid[a]) return false;

  // 直连
  if (clearLine(board, ar, ac, br, bc)) return true;

  // 一个拐弯
  for (const [r, c] of [[ar, bc], [br, ac]]) {
    if (emptyAt(board, r, c) && clearLine(board, ar, ac, r, c) && clearLine(board, r, c, br, bc)) return true;
  }

  // 两个拐弯：沿 a 的行/列扫，遇到空位就试着接
  for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    let r = ar + dr;
    let c = ac + dc;
    while (r >= 0 && r < board.rows && c >= 0 && c < board.cols && emptyAt(board, r, c)) {
      for (const [kr, kc] of [[r, bc], [br, c]]) {
        if (
          kr >= 0 && kr < board.rows && kc >= 0 && kc < board.cols &&
          emptyAt(board, kr, kc) &&
          clearLine(board, r, c, kr, kc) &&
          clearLine(board, kr, kc, br, bc)
        ) {
          return true;
        }
      }
      r += dr;
      c += dc;
    }
  }
  return false;
}

/** 当前盘面有多少对能连。 */
export function countMoves(board) {
  const byLogo = new Map();
  for (let i = 0; i < board.grid.length; i++) {
    const v = board.grid[i];
    if (!v) continue;
    if (!byLogo.has(v)) byLogo.set(v, []);
    byLogo.get(v).push(i);
  }
  let n = 0;
  for (const positions of byLogo.values()) {
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (canLink(board, positions[i], positions[j])) n += 1;
      }
    }
  }
  return n;
}

/** 找一对能连的（给提示 / 自动洗牌用）。 */
export function findPair(board) {
  for (let i = 0; i < board.grid.length; i++) {
    if (!board.grid[i]) continue;
    for (let j = i + 1; j < board.grid.length; j++) {
      if (board.grid[j] !== board.grid[i]) continue;
      if (canLink(board, i, j)) return [i, j];
    }
  }
  return null;
}

export function remainingPairs(board) {
  let tiles = 0;
  for (const v of board.grid) if (v) tiles += 1;
  return tiles / 2;
}
