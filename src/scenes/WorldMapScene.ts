import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS } from '../config';
import { GlobalProgressState } from '../state/GlobalProgressState';
import { MathKingdomState } from '../games/MathKingdom/MathKingdomState';
import { TOTAL_LEVELS } from '../games/MathKingdom/MathKingdomData';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NodeDef {
  key:   string;
  emoji: string;
  title: string;
  x:     number;
  y:     number;
  world: 0 | 1 | 2;
}

interface WorldDef {
  label:  string;
  yTop:   number;
  yBot:   number;
  bg:     number;
  accent: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HEADER_H = 54;
const NODE_R   = 34;

const WORLDS: WorldDef[] = [
  { label: '🔮 Kỳ Diệu', yTop:  80, yBot: 290, bg: 0x1a0a2a, accent: 0x9b59b6 },
  { label: '🧠 Trí Tuệ', yTop: 290, yBot: 540, bg: 0x0d1a3a, accent: 0x3498db },
  { label: '🌿 Sáng Tạo', yTop: 540, yBot: 820, bg: 0x0d2a0d, accent: 0x27ae60 },
];

const NODES: NodeDef[] = [
  // World 1 (Creative/Green)
  { key: SCENE_KEYS.DRAW_GUESS,       emoji: '🎨',  title: 'Vẽ & Đoán',     x: 240, y: 762, world: 0 },
  { key: SCENE_KEYS.COLORING,         emoji: '🖌️',  title: 'Tô Màu',         x: 340, y: 692, world: 0 },
  { key: SCENE_KEYS.ROTATE_PUZZLE,    emoji: '🔄',  title: 'Ghép Hình',      x: 140, y: 622, world: 0 },
  // World 2 (Brain/Blue)
  { key: SCENE_KEYS.TIC_TAC_TOE,      emoji: '✖⭕', title: 'X O Fun',        x: 240, y: 492, world: 1 },
  { key: SCENE_KEYS.ODD_ONE_OUT,      emoji: '🔍',  title: 'Tìm Khác Biệt',  x: 340, y: 422, world: 1 },
  { key: SCENE_KEYS.QUIZ,             emoji: '🧠',  title: 'Quiz',            x: 140, y: 352, world: 1 },
  // World 3 (Magic/Purple)
  { key: SCENE_KEYS.MEMORY,           emoji: '🐾',  title: 'Lật Thẻ',        x: 240, y: 252, world: 2 },
  { key: SCENE_KEYS.COUNTING,         emoji: '🔢',  title: 'Học Đếm',        x: 340, y: 182, world: 2 },
  { key: SCENE_KEYS.MATH_KINGDOM_MAP, emoji: '🏰',  title: 'Vương Quốc',     x: 140, y: 112, world: 2 },
];

// ---------------------------------------------------------------------------
// Helper — MathKingdom normalised stars (0–3)
// ---------------------------------------------------------------------------

function getMkNormalizedStars(): 0 | 1 | 2 | 3 {
  const mk = MathKingdomState.getInstance();
  let total = 0;
  for (let i = 1; i <= TOTAL_LEVELS; i++) total += mk.getStars(i);
  if (total >= 12) return 3;
  if (total >= 6)  return 2;
  if (total > 0)   return 1;
  return 0;
}

function getMkCompletions(): number {
  return MathKingdomState.getInstance().getStars(1) > 0 ? 1 : 0;
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

export class WorldMapScene extends Phaser.Scene {

  constructor() { super({ key: SCENE_KEYS.WORLD_MAP }); }

  // ------------------------------------------------------------------
  create(): void {
    const gp = GlobalProgressState.getInstance();

    // -- Background fill (fallback black)
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000);

    // -- World bands
    this.drawWorldBands();

    // -- Zigzag dotted path
    this.drawPath();

    // -- Nodes
    NODES.forEach(node => {
      const isMk     = node.key === SCENE_KEYS.MATH_KINGDOM_MAP;
      const stars     = isMk ? getMkNormalizedStars() : gp.getRecord(node.key).stars;
      const comps     = isMk ? getMkCompletions()     : gp.getRecord(node.key).completions;
      const accent    = WORLDS[node.world].accent;
      this.drawNode(node, stars, comps, accent);
    });

    // -- Header (drawn on top so it covers everything)
    const mkNorm    = getMkNormalizedStars();
    const totalStars = gp.totalStars() + mkNorm;
    this.drawHeader(totalStars);
  }

  // ------------------------------------------------------------------
  // World bands + decorations
  // ------------------------------------------------------------------

  private drawWorldBands(): void {
    const gfx = this.add.graphics();

    WORLDS.forEach((w, wi) => {
      const h = w.yBot - w.yTop;
      gfx.fillStyle(w.bg, 1);
      gfx.fillRect(0, w.yTop, GAME_WIDTH, h);

      // Dividing line (not after last)
      if (wi < WORLDS.length - 1) {
        gfx.lineStyle(1, w.accent, 0.35);
        gfx.beginPath();
        gfx.moveTo(0, w.yBot);
        gfx.lineTo(GAME_WIDTH, w.yBot);
        gfx.strokePath();
      }

      // World label — left side, vertically centred in band
      const midY = w.yTop + h / 2;
      this.add.text(14, midY, w.label, {
        fontSize: '13px',
        color:    '#ffffff',
      }).setOrigin(0, 0.5).setAlpha(0.55);
    });

    // ---------- Decorations ----------

    // World 3 (purple, index 0 in WORLDS array): tiny star dots
    const purpleW = WORLDS[0];
    for (let i = 0; i < 20; i++) {
      const sx = Phaser.Math.Between(10, GAME_WIDTH - 10);
      const sy = Phaser.Math.Between(purpleW.yTop + 4, purpleW.yBot - 4);
      gfx.fillStyle(0xffffff, 0.4);
      gfx.fillCircle(sx, sy, Phaser.Math.Between(1, 2));
    }

    // World 1 (green, index 2 in WORLDS array): simple triangular trees at bottom strip
    const greenW = WORLDS[2];
    const treePositions = [30, 80, 420, 460];
    treePositions.forEach(tx => {
      const ty = greenW.yBot - 14;
      gfx.fillStyle(0x27ae60, 0.45);
      gfx.fillTriangle(tx, ty, tx - 10, ty + 20, tx + 10, ty + 20);
      gfx.fillTriangle(tx, ty - 10, tx - 8, ty + 8, tx + 8, ty + 8);
    });
  }

  // ------------------------------------------------------------------
  // Dotted zigzag path
  // ------------------------------------------------------------------

  private drawPath(): void {
    const gfx = this.add.graphics();
    gfx.fillStyle(0xf1c40f, 0.55);

    for (let i = 0; i < NODES.length - 1; i++) {
      const a = NODES[i];
      const b = NODES[i + 1];
      const dx  = b.x - a.x;
      const dy  = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.floor(len / 18);

      for (let s = 1; s < steps; s++) {
        const t  = s / steps;
        const px = a.x + dx * t;
        const py = a.y + dy * t;
        gfx.fillCircle(px, py, 3);
      }
    }
  }

  // ------------------------------------------------------------------
  // Single node
  // ------------------------------------------------------------------

  private drawNode(
    node:    NodeDef,
    stars:   0 | 1 | 2 | 3,
    comps:   number,
    accent:  number,
  ): void {
    const played  = comps > 0 || stars > 0;
    const alpha   = played ? 1.0 : 0.65;
    const container = this.add.container(node.x, node.y);

    // Circle background
    const circ = this.add.graphics();
    circ.fillStyle(accent, alpha);
    circ.fillCircle(0, 0, NODE_R);
    circ.lineStyle(2, 0xffffff, 0.9);
    circ.strokeCircle(0, 0, NODE_R);
    container.add(circ);

    // Emoji
    const emojiText = this.add.text(0, 0, node.emoji, {
      fontSize: '26px',
    }).setOrigin(0.5, 0.5);
    container.add(emojiText);

    // Game title below circle
    const titleText = this.add.text(0, NODE_R + 10, node.title, {
      fontSize:   '10px',
      color:      '#ffffff',
      wordWrap:   { width: 80 },
      align:      'center',
    }).setOrigin(0.5, 0);
    container.add(titleText);

    // Stars display
    if (stars > 0) {
      const starsText = this.add.text(0, NODE_R + 22, '⭐'.repeat(stars), {
        fontSize: '10px',
      }).setOrigin(0.5, 0);
      container.add(starsText);
    }

    // Completion count (right side)
    if (comps > 0) {
      const compText = this.add.text(NODE_R + 6, -NODE_R + 4, `×${comps}`, {
        fontSize: '11px',
        color:    '#aaaacc',
      }).setOrigin(0, 0);
      container.add(compText);
    }

    // Interactivity — register on hitZone (containers don't propagate input)
    const hitZone = this.add.circle(0, 0, NODE_R + 10, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });
    container.add(hitZone);

    hitZone.on('pointerover',  () => container.setScale(1.12));
    hitZone.on('pointerout',   () => container.setScale(1.0));
    hitZone.on('pointerdown',  () => {
      this.cameras.main.fadeOut(220, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(node.key));
    });
  }

  // ------------------------------------------------------------------
  // Header
  // ------------------------------------------------------------------

  private drawHeader(totalStars: number): void {
    // Dark bar
    const hdr = this.add.graphics();
    hdr.fillStyle(0x0a1628, 0.95);
    hdr.fillRect(0, 0, GAME_WIDTH, HEADER_H);

    // Title
    this.add.text(GAME_WIDTH / 2, HEADER_H / 2, '🎮 Kids Kingdom', {
      fontSize:   '17px',
      color:      '#ffffff',
      fontStyle:  'bold',
    }).setOrigin(0.5, 0.5);

    // Stars badge
    this.add.text(GAME_WIDTH - 10, HEADER_H / 2, `⭐ ${totalStars} / 27`, {
      fontSize: '13px',
      color:    '#f1c40f',
    }).setOrigin(1, 0.5);

    // Reset button — bottom-right corner of screen
    const resetBtn = this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, '🔄 Reset', {
      fontSize: '12px',
      color:    '#555577',
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true });

    resetBtn.on('pointerdown', () => {
      GlobalProgressState.getInstance().reset();
      this.scene.restart();
    });
  }
}
