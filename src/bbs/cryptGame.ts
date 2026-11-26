import type { CryptEnemy, CryptItem, CryptState, Direction } from './types';

const FLOOR_TEMPLATES: readonly string[][] = [
  [
    '###################',
    '#....#.......#....#',
    '#.##.#.#####.#.##.#',
    '#.................#',
    '###.###.....###.###',
    '#.....#.....#.....#',
    '#.##...........##.#',
    '#....###...###....#',
    '#.##...........##.#',
    '#.................#',
    '###################',
  ],
  [
    '###################',
    '#.........#.......#',
    '#.###.###.#.#####.#',
    '#.#...#...........#',
    '#.#.#.#.#####.###.#',
    '#...#...........#.#',
    '###.#####.###.#.#.#',
    '#.........#...#...#',
    '#.#######.#.#####.#',
    '#.................#',
    '###################',
  ],
  [
    '###################',
    '#.....#.....#.....#',
    '#.###.#.###.#.###.#',
    '#.................#',
    '#.##.####.####.##.#',
    '#....#.......#....#',
    '#.##.#.#####.#.##.#',
    '#.................#',
    '#.#####.###.#####.#',
    '#.................#',
    '###################',
  ],
];

export const MAX_CRYPT_FLOORS = 3;

export function createCryptFloor(
  floor: number,
  carry?: { hp: number; maxHp: number; score: number; relicsCollected: number; ghostsBanished: number }
): CryptState {
  const idx = Math.max(0, Math.min(FLOOR_TEMPLATES.length - 1, floor - 1));
  const walls = [...FLOOR_TEMPLATES[idx]];
  const height = walls.length;
  const width = walls[0].length;

  const enemies: CryptEnemy[] =
    floor === 1
      ? [
          { id: 'e1', kind: 'GHOST', symbol: 'G', x: 14, y: 3, hp: 6, maxHp: 6, atk: 3 },
          { id: 'e2', kind: 'GHOST', symbol: 'G', x: 9, y: 8, hp: 6, maxHp: 6, atk: 3 },
        ]
      : floor === 2
        ? [
            { id: 'e3', kind: 'GHOST', symbol: 'G', x: 12, y: 3, hp: 7, maxHp: 7, atk: 4 },
            { id: 'e4', kind: 'WRAITH', symbol: 'W', x: 15, y: 7, hp: 10, maxHp: 10, atk: 5 },
          ]
        : [
            { id: 'e5', kind: 'WRAITH', symbol: 'W', x: 10, y: 5, hp: 11, maxHp: 11, atk: 5 },
            { id: 'e6', kind: 'WRAITH', symbol: 'W', x: 15, y: 3, hp: 11, maxHp: 11, atk: 5 },
            { id: 'e7', kind: 'GHOST', symbol: 'G', x: 5, y: 9, hp: 8, maxHp: 8, atk: 4 },
          ];

  const items: CryptItem[] =
    floor === 1
      ? [
          { id: 'i1', kind: 'RELIC', symbol: '*', x: 9, y: 3, value: 250 },
          { id: 'i2', kind: 'RELIC', symbol: '*', x: 16, y: 6, value: 250 },
          { id: 'i3', kind: 'ELIXIR', symbol: '+', x: 3, y: 9, value: 8 },
        ]
      : floor === 2
        ? [
            { id: 'i4', kind: 'RELIC', symbol: '*', x: 7, y: 5, value: 350 },
            { id: 'i5', kind: 'RELIC', symbol: '*', x: 17, y: 1, value: 350 },
            { id: 'i6', kind: 'ELIXIR', symbol: '+', x: 3, y: 7, value: 10 },
          ]
        : [
            { id: 'i7', kind: 'RELIC', symbol: '*', x: 9, y: 5, value: 500 },
            { id: 'i8', kind: 'RELIC', symbol: '*', x: 17, y: 9, value: 500 },
            { id: 'i9', kind: 'ELIXIR', symbol: '+', x: 9, y: 1, value: 12 },
          ];

  const stairsX = 17;
  const stairsY = floor === 2 ? 9 : 7;

  return {
    floor,
    turn: 0,
    width,
    height,
    walls,
    playerX: 1,
    playerY: 1,
    hp: carry?.hp ?? 24,
    maxHp: carry?.maxHp ?? 24,
    atk: 4 + floor,
    score: carry?.score ?? 0,
    relicsCollected: carry?.relicsCollected ?? 0,
    ghostsBanished: carry?.ghostsBanished ?? 0,
    stairsX,
    stairsY,
    enemies,
    items,
    log: [
      `FLOOR ${floor}/${MAX_CRYPT_FLOORS} LOADED · Collect cursed relics (*) and reach stairs (>).`,
    ],
    gameOver: false,
    victory: false,
  };
}

function isWall(walls: readonly string[], x: number, y: number): boolean {
  if (y < 0 || y >= walls.length || x < 0 || x >= walls[0].length) return true;
  return walls[y][x] === '#';
}

export interface CryptStepResult {
  state: CryptState;
  event: 'move' | 'blocked' | 'attack' | 'relic' | 'elixir' | 'stairs' | 'victory' | 'death';
}

export function stepCrypt(prev: CryptState, dir: Direction): CryptStepResult {
  if (prev.gameOver || prev.victory) {
    return { state: prev, event: 'blocked' };
  }

  const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
  const dy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
  const nx = prev.playerX + dx;
  const ny = prev.playerY + dy;

  if (isWall(prev.walls, nx, ny)) {
    return {
      state: {
        ...prev,
        log: ['Blocked by damp catacomb stone.', ...prev.log].slice(0, 6),
      },
      event: 'blocked',
    };
  }

  const nextLog = [...prev.log];
  let playerX = prev.playerX;
  let playerY = prev.playerY;
  let hp = prev.hp;
  let score = prev.score;
  let relicsCollected = prev.relicsCollected;
  let ghostsBanished = prev.ghostsBanished;
  let enemies = prev.enemies.map((e) => ({ ...e }));
  let items = prev.items.map((it) => ({ ...it }));
  let event: CryptStepResult['event'] = 'move';

  // 1. Check bump-to-attack combat
  const targetEnemy = enemies.find((e) => e.x === nx && e.y === ny);
  if (targetEnemy) {
    targetEnemy.hp -= prev.atk;
    event = 'attack';
    if (targetEnemy.hp <= 0) {
      enemies = enemies.filter((e) => e.id !== targetEnemy.id);
      const bounty = targetEnemy.kind === 'WRAITH' ? 300 : 180;
      score += bounty;
      ghostsBanished += 1;
      nextLog.unshift(`Banished ${targetEnemy.kind} with ${prev.atk} DMG (+${bounty} pts)!`);
    } else {
      nextLog.unshift(
        `Struck ${targetEnemy.kind} for ${prev.atk} DMG (${targetEnemy.hp}/${targetEnemy.maxHp} HP left).`
      );
    }
  } else {
    playerX = nx;
    playerY = ny;

    // 2. Check item pickup
    const item = items.find((it) => it.x === playerX && it.y === playerY);
    if (item) {
      items = items.filter((it) => it.id !== item.id);
      if (item.kind === 'RELIC') {
        score += item.value;
        relicsCollected += 1;
        event = 'relic';
        nextLog.unshift(`Recovered Cursed Relic * (+${item.value} pts)!`);
      } else {
        hp = Math.min(prev.maxHp, hp + item.value);
        event = 'elixir';
        nextLog.unshift(`Drank Phosphor Elixir + (HP restored to ${hp}/${prev.maxHp}).`);
      }
    }

    // 3. Check stairs transition
    if (playerX === prev.stairsX && playerY === prev.stairsY) {
      if (prev.floor >= MAX_CRYPT_FLOORS) {
        const escapeBonus = 1000 + hp * 25;
        return {
          state: {
            ...prev,
            playerX,
            playerY,
            turn: prev.turn + 1,
            score: score + escapeBonus,
            relicsCollected,
            ghostsBanished,
            enemies,
            items,
            victory: true,
            log: [
              `ESCAPED THE CRYPT! Victory bonus +${escapeBonus} pts (Total: ${score + escapeBonus})!`,
              ...nextLog,
            ].slice(0, 6),
          },
          event: 'victory',
        };
      }

      const floorBonus = 400;
      const nextFloor = createCryptFloor(prev.floor + 1, {
        hp: Math.min(prev.maxHp, hp + 4),
        maxHp: prev.maxHp,
        score: score + floorBonus,
        relicsCollected,
        ghostsBanished,
      });
      nextFloor.log = [
        `Descended to Floor ${prev.floor + 1} (+${floorBonus} pts, +4 HP)!`,
        ...nextFloor.log,
      ];
      return { state: nextFloor, event: 'stairs' };
    }
  }

  // 4. Enemy pursuit & attack turn
  for (const enemy of enemies) {
    const dist = Math.abs(enemy.x - playerX) + Math.abs(enemy.y - playerY);
    if (dist === 1) {
      hp = Math.max(0, hp - enemy.atk);
      nextLog.unshift(`${enemy.kind} drains ${enemy.atk} HP (${hp}/${prev.maxHp} left)!`);
    } else if (dist <= 6) {
      const stepX = enemy.x === playerX ? 0 : playerX > enemy.x ? 1 : -1;
      const stepY = enemy.y === playerY ? 0 : playerY > enemy.y ? 1 : -1;
      const candidates: Array<[number, number]> =
        Math.abs(playerX - enemy.x) >= Math.abs(playerY - enemy.y)
          ? [
              [enemy.x + stepX, enemy.y],
              [enemy.x, enemy.y + stepY],
            ]
          : [
              [enemy.x, enemy.y + stepY],
              [enemy.x + stepX, enemy.y],
            ];

      for (const [cx, cy] of candidates) {
        const occupied =
          (cx === playerX && cy === playerY) ||
          enemies.some((other) => other.id !== enemy.id && other.x === cx && other.y === cy);
        if (!occupied && !isWall(prev.walls, cx, cy)) {
          enemy.x = cx;
          enemy.y = cy;
          break;
        }
      }
    }
  }

  const gameOver = hp <= 0;
  if (gameOver) {
    event = 'death';
    nextLog.unshift('NO CARRIER — Your caller spirit faded in the catacombs!');
  }

  return {
    state: {
      ...prev,
      turn: prev.turn + 1,
      playerX,
      playerY,
      hp,
      score,
      relicsCollected,
      ghostsBanished,
      enemies,
      items,
      gameOver,
      log: nextLog.slice(0, 6),
    },
    event,
  };
}

export function renderCryptAscii(state: CryptState): string[] {
  const rows: string[] = [];
  for (let y = 0; y < state.height; y++) {
    let line = '';
    for (let x = 0; x < state.width; x++) {
      if (x === state.playerX && y === state.playerY) {
        line += '@';
      } else {
        const enemy = state.enemies.find((e) => e.x === x && e.y === y);
        if (enemy) {
          line += enemy.symbol;
        } else {
          const item = state.items.find((it) => it.x === x && it.y === y);
          if (item) {
            line += item.symbol;
          } else if (x === state.stairsX && y === state.stairsY) {
            line += '>';
          } else {
            line += state.walls[y][x];
          }
        }
      }
    }
    rows.push(line);
  }
  return rows;
}
