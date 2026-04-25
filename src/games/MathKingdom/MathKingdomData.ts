// Pure data layer — no Phaser import, no side effects
// All randomisation uses plain Math.random()

export type MiniGameType =
  | 'counting'
  | 'tapNumber'
  | 'dragMatch'
  | 'countByColor'
  | 'sortGroup'
  | 'unlock';

export interface ObjectDef { emoji: string; label: string; }
export interface ColorDef  { hex: string;  name: string;  emoji: string; }

export interface LevelConfig {
  levelId:    number;
  worldId:    number;
  miniGame:   MiniGameType;
  minCount:   number;
  maxCount:   number;
  objectPool: ObjectDef[];
  colorPool?: ColorDef[];
  hintDelay:  number;   // ms before guide shows hint
  title:      string;
}

export interface WorldDef {
  worldId:   number;
  name:      string;
  emoji:     string;
  bgColor:   number;
  nodeColor: number;
  levels:    LevelConfig[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Object pools ──────────────────────────────────────────────────────────────
const FOREST: ObjectDef[] = [
  { emoji: '🐦', label: 'chim'       },
  { emoji: '🐛', label: 'sâu'        },
  { emoji: '🐞', label: 'bọ rùa'     },
  { emoji: '🍄', label: 'nấm'        },
  { emoji: '🦋', label: 'bướm'       },
  { emoji: '🐝', label: 'ong'        },
  { emoji: '🌸', label: 'hoa'        },
];

const COLORLAND: ObjectDef[] = [
  { emoji: '⭐', label: 'ngôi sao'   },
  { emoji: '🔶', label: 'hình thoi'  },
  { emoji: '💎', label: 'tinh thể'   },
  { emoji: '🎈', label: 'bóng bay'   },
];

const RESCUE: ObjectDef[] = [
  { emoji: '🌟', label: 'sao sáng'  },
  { emoji: '🌙', label: 'mặt trăng' },
  { emoji: '☀️', label: 'mặt trời'  },
  { emoji: '⭐', label: 'ngôi sao'  },
];

export const COLOR_POOL: ColorDef[] = [
  { hex: '#e74c3c', name: 'đỏ',      emoji: '🔴' },
  { hex: '#3498db', name: 'xanh',    emoji: '🔵' },
  { hex: '#f1c40f', name: 'vàng',    emoji: '🟡' },
  { hex: '#2ecc71', name: 'xanh lá', emoji: '🟢' },
];

// ── World / level definitions ─────────────────────────────────────────────────
export function getWorldDefs(): WorldDef[] {
  return [
    {
      worldId: 1, name: 'Rừng Đếm Số', emoji: '🌲',
      bgColor: 0x0d2a0d, nodeColor: 0x27ae60,
      levels: [
        { levelId: 1, worldId: 1, miniGame: 'counting',
          minCount: 3, maxCount: 5, objectPool: FOREST.slice(0, 3),
          hintDelay: 5000, title: 'Đếm xem có mấy con?' },
        { levelId: 2, worldId: 1, miniGame: 'tapNumber',
          minCount: 2, maxCount: 6, objectPool: FOREST,
          hintDelay: 5000, title: 'Tìm số đúng!' },
        { levelId: 3, worldId: 1, miniGame: 'dragMatch',
          minCount: 2, maxCount: 4, objectPool: FOREST,
          hintDelay: 7000, title: 'Kéo số vào nhóm!' },
      ],
    },
    {
      worldId: 2, name: 'Vùng Màu Sắc', emoji: '🌈',
      bgColor: 0x0d0d2a, nodeColor: 0x9b59b6,
      levels: [
        { levelId: 4, worldId: 2, miniGame: 'countByColor',
          minCount: 2, maxCount: 4, objectPool: COLORLAND,
          colorPool: COLOR_POOL.slice(0, 3),
          hintDelay: 5000, title: 'Đếm theo màu!' },
        { levelId: 5, worldId: 2, miniGame: 'sortGroup',
          minCount: 2, maxCount: 4, objectPool: COLORLAND,
          colorPool: COLOR_POOL.slice(0, 2),
          hintDelay: 7000, title: 'Sắp xếp vào nhóm!' },
      ],
    },
    {
      worldId: 3, name: 'Khu Giải Cứu', emoji: '🏰',
      bgColor: 0x1a0a00, nodeColor: 0xe74c3c,
      levels: [
        { levelId: 6, worldId: 3, miniGame: 'unlock',
          minCount: 3, maxCount: 4, objectPool: RESCUE,
          hintDelay: 6000, title: 'Giải mã để mở khóa!' },
      ],
    },
  ];
}

export function getAllLevels(): LevelConfig[] {
  return getWorldDefs().flatMap(w => w.levels);
}
export function getLevelConfig(id: number): LevelConfig | undefined {
  return getAllLevels().find(l => l.levelId === id);
}
export const TOTAL_LEVELS = getAllLevels().length;

// ── Question generators ───────────────────────────────────────────────────────

export interface CountingQuestion {
  objects:  ObjectDef[];
  count:    number;
  choices:  number[];   // 4 distinct numbers
}
export function generateCountingQuestion(cfg: LevelConfig): CountingQuestion {
  const count = rnd(cfg.minCount, cfg.maxCount);
  const obj   = cfg.objectPool[rnd(0, cfg.objectPool.length - 1)];
  const set   = new Set<number>([count]);
  while (set.size < 4) {
    const d = rnd(Math.max(1, count - 3), count + 3);
    if (d !== count) set.add(d);
  }
  return { objects: Array(count).fill(obj), count, choices: shuffle([...set]) };
}

export interface TapNumberQuestion {
  targetNumber: number;
  rows: { obj: ObjectDef; count: number }[];
}
export function generateTapNumberQuestion(cfg: LevelConfig): TapNumberQuestion {
  const target = rnd(cfg.minCount, cfg.maxCount);
  const set    = new Set<number>([target]);
  while (set.size < 4) {
    const c = rnd(Math.max(1, target - 3), target + 4);
    if (c !== target) set.add(c);
  }
  const rows = shuffle([...set]).map(count => ({
    obj: cfg.objectPool[rnd(0, cfg.objectPool.length - 1)],
    count,
  }));
  return { targetNumber: target, rows };
}

export interface DragGroup { emoji: string; count: number; }
export function generateDragMatchGroups(cfg: LevelConfig): DragGroup[] {
  const n   = 3;
  const set = new Set<number>();
  while (set.size < n) set.add(rnd(cfg.minCount, cfg.maxCount));
  return [...set].map(count => ({
    emoji: cfg.objectPool[rnd(0, cfg.objectPool.length - 1)].emoji,
    count,
  }));
}

export interface ColoredObject { emoji: string; color: ColorDef; }
export function generateCountByColorQuestion(cfg: LevelConfig): {
  objects: ColoredObject[]; targetColor: ColorDef; correctCount: number;
} {
  const colors  = cfg.colorPool ?? COLOR_POOL;
  const target  = colors[rnd(0, colors.length - 1)];
  const total   = rnd(6, 10);
  const correct = rnd(cfg.minCount, Math.min(cfg.maxCount, total - 1));
  const others  = colors.filter(c => c !== target);
  const objects: ColoredObject[] = [];
  for (let i = 0; i < total; i++) {
    const col = i < correct ? target : others[rnd(0, others.length - 1)];
    objects.push({ emoji: cfg.objectPool[rnd(0, cfg.objectPool.length - 1)].emoji, color: col });
  }
  return { objects: shuffle(objects), targetColor: target, correctCount: correct };
}

export function generateSortGroupData(cfg: LevelConfig): {
  objects: ColoredObject[]; buckets: ColorDef[];
} {
  const buckets = (cfg.colorPool ?? COLOR_POOL).slice(0, 2);
  const objects: ColoredObject[] = [];
  buckets.forEach(color => {
    const count = rnd(cfg.minCount, cfg.maxCount);
    for (let i = 0; i < count; i++) {
      objects.push({ emoji: cfg.objectPool[rnd(0, cfg.objectPool.length - 1)].emoji, color });
    }
  });
  return { objects: shuffle(objects), buckets };
}

export interface UnlockChallenge {
  sequence: string[];   // shown items (last is '?')
  answer:   string;
  choices:  string[];
}
const PATTERNS: { seq: string[]; ans: string }[] = [
  { seq: ['🌟','🌙','🌟','?'], ans: '🌙' },
  { seq: ['⭐','⭐','🌙','?'], ans: '⭐' },
  { seq: ['🌈','🌟','🌈','?'], ans: '🌟' },
  { seq: ['🌙','⭐','🌙','?'], ans: '⭐' },
  { seq: ['🌟','☀️','🌟','?'], ans: '☀️' },
];
export function generateUnlockChallenge(): UnlockChallenge {
  const p = PATTERNS[rnd(0, PATTERNS.length - 1)];
  const all = ['🌟','🌙','⭐','🌈','☀️','💫'];
  const set = new Set<string>([p.ans]);
  while (set.size < 4) set.add(all[rnd(0, all.length - 1)]);
  return { sequence: p.seq.slice(0, -1), answer: p.ans, choices: shuffle([...set]) };
}
