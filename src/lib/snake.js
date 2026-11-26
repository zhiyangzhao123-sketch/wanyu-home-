// 贪吃蛇的规则：走一步、吃食、撞墙撞自己。
//
// 坐标用 {x, y}，左上角是 (0,0)。蛇头在数组第一个。
// 不穿墙（撞墙就死），这是老式玩法。

export const COLS = 20;
export const ROWS = 20;

export const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function createGame(rand = Math.random) {
  const snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ];
  return {
    snake,
    dir: "right",
    pendingDir: "right",
    food: spawnFood(snake, rand),
    score: 0,
    dead: false,
    ate: false,
  };
}

/** 在空格里随机放一颗果子。 */
export function spawnFood(snake, rand = Math.random) {
  const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
  const free = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (!free.length) return null;
  return free[Math.floor(rand() * free.length)];
}

/** 不能 180 度掉头。 */
export function canTurn(current, next) {
  const a = DIRS[current];
  const b = DIRS[next];
  return !(a.x + b.x === 0 && a.y + b.y === 0);
}

export function turn(game, next) {
  if (canTurn(game.dir, next)) game.pendingDir = next;
  return game;
}

/**
 * 走一步。返回新的 game（就地改也行，这里返回同一对象方便循环）。
 */
export function step(game, rand = Math.random) {
  if (game.dead) return game;
  game.dir = game.pendingDir;
  const d = DIRS[game.dir];
  const head = game.snake[0];
  const next = { x: head.x + d.x, y: head.y + d.y };

  // 撞墙
  if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS) {
    game.dead = true;
    return game;
  }

  const eating = game.food && next.x === game.food.x && next.y === game.food.y;
  // 撞自己：不吃食时尾巴会移开，所以尾巴那格不算
  const body = eating ? game.snake : game.snake.slice(0, -1);
  if (body.some((s) => s.x === next.x && s.y === next.y)) {
    game.dead = true;
    return game;
  }

  game.snake.unshift(next);
  game.ate = false;
  if (eating) {
    game.score += 10;
    game.ate = true;
    game.food = spawnFood(game.snake, rand);
  } else {
    game.snake.pop();
  }
  return game;
}

/** 速度：越长越快，最快 70ms 一步。 */
export function tickInterval(score) {
  return Math.max(70, 150 - Math.floor(score / 50) * 10);
}
