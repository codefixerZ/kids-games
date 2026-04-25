import { SCENE_KEYS } from '../config';

export interface GameRecord {
  stars:       0 | 1 | 2 | 3;
  completions: number;
  bestTimeMs:  number; // 0 = never recorded
}

const STORAGE_KEY = 'kidsGamesProgress_v1';

// The 8 non-MathKingdom games tracked here
const TRACKED_KEYS: string[] = [
  SCENE_KEYS.DRAW_GUESS, SCENE_KEYS.QUIZ, SCENE_KEYS.MEMORY, SCENE_KEYS.COUNTING,
  SCENE_KEYS.ODD_ONE_OUT, SCENE_KEYS.ROTATE_PUZZLE, SCENE_KEYS.COLORING,
  SCENE_KEYS.TIC_TAC_TOE,
];

export class GlobalProgressState {
  private static _inst: GlobalProgressState | null = null;
  private data: Record<string, GameRecord> = {};

  private constructor() { this.load(); }

  static getInstance(): GlobalProgressState {
    if (!GlobalProgressState._inst) GlobalProgressState._inst = new GlobalProgressState();
    return GlobalProgressState._inst;
  }

  private defaultRecord(): GameRecord { return { stars: 0, completions: 0, bestTimeMs: 0 }; }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.data = raw ? (JSON.parse(raw) as Record<string, GameRecord>) : {};
    } catch { this.data = {}; }
    TRACKED_KEYS.forEach(k => { if (!this.data[k]) this.data[k] = this.defaultRecord(); });
  }

  private persist(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); } catch { /* ignore */ }
  }

  getRecord(key: string): GameRecord {
    return this.data[key] ?? this.defaultRecord();
  }

  /** Call this when a game round/session completes. stars = 1|2|3, durationMs = elapsed ms (0 if unknown) */
  recordPlay(key: string, stars: 1 | 2 | 3, durationMs = 0): void {
    const r = this.data[key] ?? this.defaultRecord();
    r.completions++;
    if ((stars as number) > r.stars) r.stars = stars;
    if (durationMs > 0 && (r.bestTimeMs === 0 || durationMs < r.bestTimeMs)) r.bestTimeMs = durationMs;
    this.data[key] = r;
    this.persist();
  }

  totalStars(): number {
    return TRACKED_KEYS.reduce((s, k) => s + this.getRecord(k).stars, 0);
  }

  reset(): void {
    this.data = {};
    TRACKED_KEYS.forEach(k => { this.data[k] = this.defaultRecord(); });
    this.persist();
  }
}
