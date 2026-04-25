import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS } from '../../config';

// ── Layout ────────────────────────────────────────────────────────────────────
const HEADER_H   = 45;
const GRID_COLS  = 3;
const GRID_ROWS  = 3;
const TILE_SIZE  = 130;
const GRID_GAP   = 4;
const GRID_W     = GRID_COLS * TILE_SIZE + (GRID_COLS - 1) * GRID_GAP;
const GRID_H     = GRID_ROWS * TILE_SIZE + (GRID_ROWS - 1) * GRID_GAP;
const GRID_LEFT  = (GAME_WIDTH - GRID_W) / 2;
const GRID_TOP   = HEADER_H + 90;

// ── Puzzles: each has a name + 3×3 emoji tile layout ────────────────────────
interface Puzzle {
  name: string;
  tiles: string[][];   // 3×3 grid of emoji/text for each tile
  bg: number;          // background colour
}

const PUZZLES: Puzzle[] = [
  {
    name: '🌈 Cầu Vồng',
    bg: 0x0a1628,
    tiles: [
      ['🟥','🟧','🟨'],
      ['🟩','🟦','🟪'],
      ['⬛','⬜','🌈'],
    ],
  },
  {
    name: '🐾 Khuôn Mặt',
    bg: 0x0a1628,
    tiles: [
      ['😊','😊','😊'],
      ['👁️','👄','👁️'],
      ['😊','👃','😊'],
    ],
  },
  {
    name: '🌸 Hoa Mùa Xuân',
    bg: 0x0a1628,
    tiles: [
      ['🌿','🌸','🌿'],
      ['🌸','🌺','🌸'],
      ['🌿','🌸','🌿'],
    ],
  },
  {
    name: '🚀 Vũ Trụ',
    bg: 0x0a1628,
    tiles: [
      ['⭐','🌙','⭐'],
      ['🌙','🚀','🌙'],
      ['⭐','🌙','⭐'],
    ],
  },
  {
    name: '🏡 Ngôi Nhà',
    bg: 0x0a1628,
    tiles: [
      ['☁️','🏠','☁️'],
      ['🌳','🏠','🌳'],
      ['🌱','🌱','🌱'],
    ],
  },
];

interface TileState {
  correctRot: number;   // 0 | 90 | 180 | 270
  currentRot: number;
  container: Phaser.GameObjects.Container;
  emojiText: Phaser.GameObjects.Text;
}

export class RotatePuzzleScene extends Phaser.Scene {
  private tiles:      TileState[][] = [];
  private puzzleIdx   = 0;
  private moves       = 0;
  private solved      = false;

  private movesText!:  Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private nameText!:   Phaser.GameObjects.Text;

  constructor() { super({ key: SCENE_KEYS.ROTATE_PUZZLE }); }

  create() {
    this.tiles   = [];
    this.moves   = 0;
    this.solved  = false;
    this.drawBackground();
    this.drawHeader();
    this.drawInfoStrip();
    this.loadPuzzle(this.puzzleIdx);
    this.drawControls();
  }

  // ── Background ─────────────────────────────────────────────────────────────
  private drawBackground() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0d1f35);
    const g = this.add.graphics().setAlpha(0.04);
    for (let i = 0; i < 30; i++) {
      g.fillStyle(0xffffff);
      g.fillCircle(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(0, GAME_HEIGHT), Phaser.Math.Between(1, 3));
    }
  }

  // ── Header ──────────────────────────────────────────────────────────────────
  private drawHeader() {
    this.add.rectangle(GAME_WIDTH / 2, HEADER_H / 2, GAME_WIDTH, HEADER_H, 0x0a1628).setDepth(10);

    const back = this.add.text(14, 13, '⬅ Home', {
      fontSize: '14px', color: '#aaaacc', fontFamily: 'Arial',
    }).setDepth(10).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#ffffff'));
    back.on('pointerout',  () => back.setColor('#aaaacc'));
    back.on('pointerdown', () => this.goToMenu());

    this.add.text(GAME_WIDTH / 2, 13, '📘 Ghép Hình Xoay', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(10);
  }

  // ── Info strip ───────────────────────────────────────────────────────────────
  private drawInfoStrip() {
    this.add.rectangle(GAME_WIDTH / 2, HEADER_H + 35, GAME_WIDTH, 55, 0x0f2040);

    this.nameText = this.add.text(GAME_WIDTH / 2, HEADER_H + 14, '', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.movesText = this.add.text(GAME_WIDTH / 2, HEADER_H + 42, '', {
      fontSize: '13px', color: '#8899bb', fontFamily: 'Arial',
    }).setOrigin(0.5, 0);
  }

  // ── Load a puzzle ─────────────────────────────────────────────────────────
  private loadPuzzle(idx: number) {
    // Destroy old tiles
    this.tiles.forEach(row => row.forEach(t => t.container.destroy()));
    this.tiles = [];

    const puzzle = PUZZLES[idx % PUZZLES.length];
    this.nameText.setText(puzzle.name);
    this.moves  = 0;
    this.solved = false;
    this.refreshMoves();

    for (let row = 0; row < GRID_ROWS; row++) {
      this.tiles[row] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        const cx = GRID_LEFT + col * (TILE_SIZE + GRID_GAP) + TILE_SIZE / 2;
        const cy = GRID_TOP  + row * (TILE_SIZE + GRID_GAP) + TILE_SIZE / 2;

        // Randomise rotation in steps of 90
        const correctRot = 0;
        const steps = [0, 90, 180, 270];
        const currentRot = steps[Phaser.Math.Between(0, 3)];

        const bg = this.add.rectangle(0, 0, TILE_SIZE - 4, TILE_SIZE - 4, 0x162040)
          .setStrokeStyle(2, 0x2a4a7a);

        const emojiText = this.add.text(0, 0, puzzle.tiles[row][col], {
          fontSize: '52px',
        }).setOrigin(0.5);

        const container = this.add.container(cx, cy, [bg, emojiText]);
        container.setAngle(currentRot);

        // Entrance pop
        container.setScale(0.5).setAlpha(0);
        this.tweens.add({
          targets: container, scaleX: 1, scaleY: 1, alpha: 1,
          ease: 'Back.easeOut', duration: 280,
          delay: (row * GRID_COLS + col) * 60,
        });

        bg.setInteractive({ useHandCursor: true });
        const tileState: TileState = { correctRot, currentRot, container, emojiText };
        bg.on('pointerover',  () => { if (!this.solved) bg.setFillStyle(0x1e3060); });
        bg.on('pointerout',   () => { if (!this.solved) bg.setFillStyle(0x162040); });
        bg.on('pointerdown',  () => this.rotateTile(tileState, bg));

        this.tiles[row][col] = tileState;
      }
    }
  }

  // ── Rotate a tile 90° clockwise ────────────────────────────────────────────
  private rotateTile(tile: TileState, bg: Phaser.GameObjects.Rectangle) {
    if (this.solved) return;
    tile.currentRot = (tile.currentRot + 90) % 360;
    this.moves++;
    this.refreshMoves();

    this.tweens.add({
      targets: tile.container,
      angle: tile.container.angle + 90,
      ease: 'Cubic.easeOut',
      duration: 200,
      onComplete: () => this.checkSolved(),
    });
  }

  // ── Check if puzzle solved ─────────────────────────────────────────────────
  private checkSolved() {
    const allCorrect = this.tiles.every(row =>
      row.every(t => t.currentRot % 360 === t.correctRot)
    );
    if (!allCorrect) return;

    this.solved = true;

    // Flash all tiles green
    this.tiles.forEach((row, ri) => row.forEach((t, ci) => {
      const bg = t.container.getAt(0) as Phaser.GameObjects.Rectangle;
      this.time.delayedCall((ri * GRID_COLS + ci) * 60, () => {
        bg.setFillStyle(0x27ae60).setStrokeStyle(3, 0x2ecc71);
        this.tweens.add({ targets: t.container, scaleX: 1.08, scaleY: 1.08, ease: 'Back.easeOut', duration: 200, yoyo: true });
      });
    }));

    this.time.delayedCall(800, () => this.showWin());
  }

  private refreshMoves() {
    this.movesText.setText(`Số lần xoay: ${this.moves}`);
  }

  // ── Controls ─────────────────────────────────────────────────────────────
  private drawControls() {
    const y = GRID_TOP + GRID_H + 30;
    this.statusText = this.add.text(GAME_WIDTH / 2, y, 'Nhấn vào ô để xoay 90°', {
      fontSize: '14px', color: '#8899bb', fontFamily: 'Arial', align: 'center',
    }).setOrigin(0.5, 0);

    // Next puzzle button
    const ny = y + 50;
    const btn = this.add.rectangle(GAME_WIDTH / 2, ny, 220, 44, 0x2c3e50)
      .setStrokeStyle(1, 0x5a8aba).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setAlpha(0.8));
    btn.on('pointerout',  () => btn.setAlpha(1));
    btn.on('pointerdown', () => { this.puzzleIdx++; this.loadPuzzle(this.puzzleIdx); });
    this.add.text(GAME_WIDTH / 2, ny, '➡ Câu đố tiếp theo', {
      fontSize: '14px', color: '#fff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  // ── Win popup ─────────────────────────────────────────────────────────────
  private showWin() {
    const stars = this.moves <= 5 ? '⭐⭐⭐' : this.moves <= 10 ? '⭐⭐' : '⭐';

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65).setDepth(20);
    const p = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(21);

    const bg    = this.add.rectangle(0, 0, 320, 320, 0x0d2244).setStrokeStyle(3, 0x3a6a9a);
    const trop  = this.add.text(0, -130, '🎉', { fontSize: '52px' }).setOrigin(0.5);
    const title = this.add.text(0, -72, 'Hoàn thành!', { fontSize: '24px', color: '#f1c40f', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
    const st    = this.add.text(0, -24, stars, { fontSize: '36px' }).setOrigin(0.5);
    const sc    = this.add.text(0, 30, `Số lần xoay: ${this.moves}`, { fontSize: '16px', color: '#ccddff', fontFamily: 'Arial' }).setOrigin(0.5);

    const mkBtn = (label: string, col: number, cy: number, fn: () => void) => {
      const b = this.add.rectangle(0, cy, 200, 44, col).setStrokeStyle(2, 0x5a8aba);
      b.setInteractive({ useHandCursor: true });
      b.on('pointerover', () => b.setAlpha(0.8)); b.on('pointerout', () => b.setAlpha(1));
      b.on('pointerdown', fn);
      const t = this.add.text(0, cy, label, { fontSize: '15px', color: '#fff', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
      return [b, t];
    };
    const [ab, at] = mkBtn('➡ Câu đố tiếp', 0x27ae60, 90, () => { p.destroy(); this.puzzleIdx++; this.loadPuzzle(this.puzzleIdx); });
    const [mb, mt] = mkBtn('🏠 Trang chủ',  0x2c3e50, 142, () => this.goToMenu());

    p.add([bg, trop, title, st, sc, ab, at, mb, mt]);
    p.setScale(0.5).setAlpha(0);
    this.tweens.add({ targets: p, scaleX: 1, scaleY: 1, alpha: 1, ease: 'Back.easeOut', duration: 380 });
  }

  private goToMenu() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(SCENE_KEYS.MENU));
  }
}
