import { TOTAL_LEVELS } from './MathKingdomData';

export interface LevelProgress {
  stars:    0 | 1 | 2 | 3;
  unlocked: boolean;
}

interface KingdomSave {
  levels:       Record<number, LevelProgress>;
  currentLevel: number;
}

const KEY = 'mathKingdomSave';

function defaultSave(): KingdomSave {
  const levels: Record<number, LevelProgress> = {};
  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    levels[i] = { stars: 0, unlocked: i === 1 };
  }
  return { levels, currentLevel: 1 };
}

export class MathKingdomState {
  private static _inst: MathKingdomState | null = null;
  private data: KingdomSave;

  private constructor() {
    this.data = this.load();
  }

  static getInstance(): MathKingdomState {
    if (!MathKingdomState._inst) MathKingdomState._inst = new MathKingdomState();
    return MathKingdomState._inst;
  }

  private load(): KingdomSave {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw) as KingdomSave;
    } catch { /* private/incognito */ }
    return defaultSave();
  }

  private save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* ignore */ }
  }

  getProgress(levelId: number): LevelProgress {
    return this.data.levels[levelId] ?? { stars: 0, unlocked: false };
  }
  isUnlocked(levelId: number): boolean { return this.getProgress(levelId).unlocked; }
  getStars(levelId: number): 0 | 1 | 2 | 3 { return this.getProgress(levelId).stars; }
  getCurrentLevel(): number { return this.data.currentLevel; }

  /** Save result and unlock the next level */
  saveResult(levelId: number, stars: 1 | 2 | 3): void {
    const prev = this.getProgress(levelId);
    this.data.levels[levelId] = {
      stars:    Math.max(prev.stars, stars) as 0 | 1 | 2 | 3,
      unlocked: true,
    };
    this.data.currentLevel = levelId;
    // Unlock next
    const next = levelId + 1;
    if (next <= TOTAL_LEVELS && !this.data.levels[next]?.unlocked) {
      this.data.levels[next] = { stars: 0, unlocked: true };
    }
    this.save();
  }

  reset(): void {
    this.data = defaultSave();
    this.save();
  }
}
