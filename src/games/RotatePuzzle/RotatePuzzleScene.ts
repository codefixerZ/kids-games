import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS } from '../../config';

// ── Layout ────────────────────────────────────────────────────────────────────
const HEADER_H   = 45;
const BOARD_SIZE = 420;
const BOARD_LEFT = (GAME_WIDTH - BOARD_SIZE) / 2;   // 30
const BOARD_TOP  = HEADER_H + 90;                   // 135

// ── Puzzle definitions ────────────────────────────────────────────────────────
type DrawFn = (ctx: CanvasRenderingContext2D, S: number) => void;

interface PuzzleDef { name: string; grid: number; draw: DrawFn; }

const PUZZLES: PuzzleDef[] = [
  {
    name: '🏡 Ngôi Nhà', grid: 3,
    draw(ctx, S) {
      // sky
      ctx.fillStyle = '#87ceeb'; ctx.fillRect(0, 0, S, S);
      // clouds
      ctx.fillStyle = '#ffffff';
      for (const [cx, cy, r] of [[80,60,28],[110,50,22],[140,62,20],[300,80,30],[330,68,24],[360,82,20]] as [number,number,number][]) {
        ctx.beginPath(); ctx.arc(cx * S/420, cy * S/420, r * S/420, 0, Math.PI*2); ctx.fill();
      }
      // sun
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath(); ctx.arc(360*S/420, 60*S/420, 34*S/420, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 3*S/420;
      for (let i = 0; i < 8; i++) {
        const a = (i/8)*Math.PI*2;
        ctx.beginPath();
        ctx.moveTo((360 + Math.cos(a)*40)*S/420, (60 + Math.sin(a)*40)*S/420);
        ctx.lineTo((360 + Math.cos(a)*52)*S/420, (60 + Math.sin(a)*52)*S/420);
        ctx.stroke();
      }
      // grass
      ctx.fillStyle = '#27ae60'; ctx.fillRect(0, 290*S/420, S, S - 290*S/420);
      // house body
      ctx.fillStyle = '#ecf0c8'; ctx.strokeStyle = '#555'; ctx.lineWidth = 3*S/420;
      const hx=80*S/420, hy=200*S/420, hw=260*S/420, hh=120*S/420;
      ctx.fillRect(hx, hy, hw, hh); ctx.strokeRect(hx, hy, hw, hh);
      // roof
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.moveTo((80-20)*S/420, 200*S/420);
      ctx.lineTo(210*S/420, 110*S/420);
      ctx.lineTo((340+20)*S/420, 200*S/420);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // door
      ctx.fillStyle = '#a0522d'; ctx.strokeStyle = '#555'; ctx.lineWidth = 2*S/420;
      ctx.fillRect(180*S/420, 270*S/420, 60*S/420, 50*S/420);
      ctx.strokeRect(180*S/420, 270*S/420, 60*S/420, 50*S/420);
      // windows
      ctx.fillStyle = '#f9e784';
      ctx.fillRect(100*S/420, 220*S/420, 60*S/420, 50*S/420);
      ctx.strokeRect(100*S/420, 220*S/420, 60*S/420, 50*S/420);
      ctx.fillRect(260*S/420, 220*S/420, 60*S/420, 50*S/420);
      ctx.strokeRect(260*S/420, 220*S/420, 60*S/420, 50*S/420);
      // window cross
      ctx.beginPath(); ctx.moveTo(130*S/420, 220*S/420); ctx.lineTo(130*S/420, 270*S/420); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(100*S/420, 245*S/420); ctx.lineTo(160*S/420, 245*S/420); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(290*S/420, 220*S/420); ctx.lineTo(290*S/420, 270*S/420); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(260*S/420, 245*S/420); ctx.lineTo(320*S/420, 245*S/420); ctx.stroke();
      // tree
      ctx.fillStyle = '#27ae60';
      ctx.beginPath(); ctx.arc(380*S/420, 250*S/420, 36*S/420, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(360*S/420, 270*S/420, 28*S/420, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#795548';
      ctx.fillRect(372*S/420, 285*S/420, 16*S/420, 30*S/420);
    },
  },
  {
    name: '🐟 Cá Nhiệt Đới', grid: 3,
    draw(ctx, S) {
      // water background
      ctx.fillStyle = '#0d47a1'; ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#1565c0'; ctx.fillRect(0, S*0.3, S, S*0.7);
      ctx.fillStyle = '#1976d2'; ctx.fillRect(0, S*0.6, S, S*0.4);
      // light rays
      ctx.strokeStyle = 'rgba(100,180,255,0.15)'; ctx.lineWidth = 20*S/420;
      for (const x of [80, 180, 300] as number[]) {
        ctx.beginPath(); ctx.moveTo(x*S/420, 0); ctx.lineTo((x+40)*S/420, S); ctx.stroke();
      }
      // seaweed
      ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 6*S/420;
      for (const [bx, by] of [[40,420],[380,420],[160,420]] as [number,number][]) {
        ctx.beginPath(); ctx.moveTo(bx*S/420, by*S/420);
        ctx.bezierCurveTo((bx-20)*S/420,(by-60)*S/420,(bx+20)*S/420,(by-120)*S/420,bx*S/420,(by-180)*S/420);
        ctx.stroke();
      }
      // fish body (orange)
      ctx.fillStyle = '#f57c00';
      ctx.beginPath(); ctx.ellipse(220*S/420, 200*S/420, 110*S/420, 70*S/420, 0, 0, Math.PI*2); ctx.fill();
      // tail
      ctx.fillStyle = '#e65100';
      ctx.beginPath();
      ctx.moveTo(326*S/420, 200*S/420);
      ctx.lineTo(390*S/420, 140*S/420);
      ctx.lineTo(390*S/420, 260*S/420);
      ctx.closePath(); ctx.fill();
      // dorsal fin
      ctx.fillStyle = '#ff8f00';
      ctx.beginPath();
      ctx.moveTo(160*S/420, 132*S/420);
      ctx.quadraticCurveTo(210*S/420, 70*S/420, 280*S/420, 132*S/420);
      ctx.closePath(); ctx.fill();
      // stripes
      ctx.strokeStyle = '#b34700'; ctx.lineWidth = 5*S/420;
      for (const sx of [190, 240] as number[]) {
        ctx.beginPath(); ctx.moveTo(sx*S/420, 138*S/420); ctx.lineTo(sx*S/420, 262*S/420); ctx.stroke();
      }
      // eye
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(130*S/420, 185*S/420, 18*S/420, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(133*S/420, 185*S/420, 8*S/420, 0, Math.PI*2); ctx.fill();
      // bubbles
      ctx.strokeStyle = 'rgba(200,230,255,0.8)'; ctx.lineWidth = 2*S/420;
      for (const [bx, by, br] of [[80,120,10],[70,90,7],[88,68,5]] as [number,number,number][]) {
        ctx.beginPath(); ctx.arc(bx*S/420, by*S/420, br*S/420, 0, Math.PI*2); ctx.stroke();
      }
      // sand
      ctx.fillStyle = '#f5deb3'; ctx.fillRect(0, 360*S/420, S, S - 360*S/420);
      ctx.strokeStyle = '#d4b483'; ctx.lineWidth = 2*S/420;
      ctx.beginPath(); ctx.moveTo(0, 360*S/420); ctx.lineTo(S, 360*S/420); ctx.stroke();
    },
  },
  {
    name: '🚀 Vũ Trụ', grid: 4,
    draw(ctx, S) {
      // space
      ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, S, S);
      // stars
      for (const [sx, sy, sr] of [[30,40,2],[80,20,3],[140,60,2],[200,30,3],[260,50,2],[320,20,3],[380,45,2],
        [50,100,2],[160,90,3],[280,110,2],[350,85,3],[400,130,2],[20,160,3],[100,180,2],[220,150,3],
        [300,200,2],[410,170,3],[60,250,2],[180,260,3],[330,240,2],[380,280,2],[30,300,3],[150,320,2],
        [250,300,3],[370,340,2],[80,380,2],[200,390,3],[310,370,2],[400,400,3]] as [number,number,number][]) {
        ctx.fillStyle = `rgba(255,255,255,${0.5 + Math.random()*0.5})`;
        ctx.beginPath(); ctx.arc(sx*S/420, sy*S/420, sr*S/420, 0, Math.PI*2); ctx.fill();
      }
      // planet
      ctx.fillStyle = '#8B4513';
      ctx.beginPath(); ctx.arc(340*S/420, 80*S/420, 55*S/420, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#CD853F';
      ctx.beginPath(); ctx.arc(320*S/420, 65*S/420, 24*S/420, 0, Math.PI*2); ctx.fill();
      // rings
      ctx.strokeStyle = '#DAA520'; ctx.lineWidth = 5*S/420;
      ctx.beginPath(); ctx.ellipse(340*S/420, 80*S/420, 76*S/420, 16*S/420, 0.2, 0, Math.PI*2); ctx.stroke();
      // rocket body
      ctx.fillStyle = '#c0c0c0';
      ctx.beginPath();
      ctx.moveTo(200*S/420, 100*S/420);
      ctx.lineTo(240*S/420, 100*S/420);
      ctx.lineTo(240*S/420, 300*S/420);
      ctx.lineTo(200*S/420, 300*S/420);
      ctx.closePath(); ctx.fill();
      // nose
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath(); ctx.moveTo(200*S/420, 100*S/420); ctx.lineTo(220*S/420, 30*S/420); ctx.lineTo(240*S/420, 100*S/420); ctx.closePath(); ctx.fill();
      // window
      ctx.fillStyle = '#87ceeb';
      ctx.beginPath(); ctx.arc(220*S/420, 170*S/420, 22*S/420, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#555'; ctx.lineWidth = 3*S/420;
      ctx.beginPath(); ctx.arc(220*S/420, 170*S/420, 22*S/420, 0, Math.PI*2); ctx.stroke();
      // fins
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath(); ctx.moveTo(200*S/420, 280*S/420); ctx.lineTo(160*S/420, 340*S/420); ctx.lineTo(200*S/420, 310*S/420); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(240*S/420, 280*S/420); ctx.lineTo(280*S/420, 340*S/420); ctx.lineTo(240*S/420, 310*S/420); ctx.closePath(); ctx.fill();
      // flames
      for (const [fx, fy, col] of [[210,320,'#f39c12'],[220,340,'#e74c3c'],[230,320,'#f39c12']] as [number,number,string][]) {
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.ellipse(fx*S/420, fy*S/420, 10*S/420, 24*S/420, 0, 0, Math.PI*2); ctx.fill();
      }
    },
  },
  {
    name: '🌸 Vườn Hoa', grid: 3,
    draw(ctx, S) {
      // sky gradient
      ctx.fillStyle = '#87ceeb'; ctx.fillRect(0, 0, S, S*0.55);
      ctx.fillStyle = '#27ae60'; ctx.fillRect(0, S*0.55, S, S*0.45);
      // sun
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath(); ctx.arc(60*S/420, 60*S/420, 40*S/420, 0, Math.PI*2); ctx.fill();
      // cloud
      ctx.fillStyle = '#fff';
      for (const [cx, cy, r] of [[280,55,22],[308,46,18],[336,56,17]] as [number,number,number][]) {
        ctx.beginPath(); ctx.arc(cx*S/420, cy*S/420, r*S/420, 0, Math.PI*2); ctx.fill();
      }
      // flower helper
      const flower = (fx: number, fy: number, petalColor: string, r: number) => {
        fx *= S/420; fy *= S/420; r *= S/420;
        // stem
        ctx.strokeStyle = '#27ae60'; ctx.lineWidth = 5*S/420;
        ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy + 90*S/420); ctx.stroke();
        // petals
        ctx.fillStyle = petalColor;
        for (let i = 0; i < 6; i++) {
          const a = (i/6)*Math.PI*2;
          ctx.beginPath(); ctx.ellipse(fx + Math.cos(a)*r, fy + Math.sin(a)*r, r*0.5, r*0.3, a, 0, Math.PI*2); ctx.fill();
        }
        // center
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath(); ctx.arc(fx, fy, r*0.38, 0, Math.PI*2); ctx.fill();
      };
      flower(100, 190, '#e74c3c', 36);
      flower(210, 180, '#9b59b6', 36);
      flower(320, 195, '#e67e22', 36);
      flower(60, 250, '#3498db', 28);
      flower(370, 245, '#e91e8c', 28);
      // butterflies
      ctx.fillStyle = '#f1c40f';
      for (const [bx, by] of [[160, 120],[280, 100]] as [number,number][]) {
        const bxS = bx*S/420, byS = by*S/420;
        ctx.beginPath(); ctx.ellipse(bxS-10*S/420, byS, 12*S/420, 7*S/420, -0.4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(bxS+10*S/420, byS, 12*S/420, 7*S/420, 0.4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#e67e22';
        ctx.beginPath(); ctx.ellipse(bxS, byS+4*S/420, 4*S/420, 8*S/420, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#f1c40f';
      }
    },
  },
];

interface TileState {
  container: Phaser.GameObjects.Container;
  currentRot: number;   // 0 | 90 | 180 | 270
}

export class RotatePuzzleScene extends Phaser.Scene {
  private tiles:       TileState[][] = [];
  private puzzleIdx    = 0;
  private moves        = 0;
  private solved       = false;
  private movesText!:  Phaser.GameObjects.Text;
  private nameText!:   Phaser.GameObjects.Text;
  private texKey       = '';

  constructor() { super({ key: SCENE_KEYS.ROTATE_PUZZLE }); }

  create() {
    this.puzzleIdx = 0;
    this.drawBackground();
    this.drawHeader();
    this.drawInfoStrip();
    this.drawControls();
    this.loadPuzzle(0);
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
    this.nameText = this.add.text(GAME_WIDTH / 2, HEADER_H + 12, '', {
      fontSize: '17px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.movesText = this.add.text(GAME_WIDTH / 2, HEADER_H + 42, '', {
      fontSize: '13px', color: '#8899bb', fontFamily: 'Arial',
    }).setOrigin(0.5, 0);
  }

  // ── Controls (below board) ────────────────────────────────────────────────
  private drawControls() {
    const y = BOARD_TOP + BOARD_SIZE + 26;
    this.add.text(GAME_WIDTH / 2, y, 'Nhấn vào ô để xoay 90°', {
      fontSize: '14px', color: '#8899bb', fontFamily: 'Arial', align: 'center',
    }).setOrigin(0.5, 0);

    const ny = y + 46;
    const btn = this.add.rectangle(GAME_WIDTH / 2, ny, 230, 44, 0x2c3e50)
      .setStrokeStyle(1, 0x5a8aba).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setAlpha(0.8));
    btn.on('pointerout',  () => btn.setAlpha(1));
    btn.on('pointerdown', () => { this.puzzleIdx++; this.loadPuzzle(this.puzzleIdx); });
    this.add.text(GAME_WIDTH / 2, ny, '➡ Câu đố tiếp theo', {
      fontSize: '14px', color: '#fff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  // ── Load puzzle ──────────────────────────────────────────────────────────
  private loadPuzzle(pIdx: number) {
    // Destroy previous tiles
    this.tiles.forEach(row => row.forEach(t => t.container.destroy()));
    this.tiles = [];
    this.moves  = 0;
    this.solved = false;

    // Remove old texture
    if (this.texKey && this.textures.exists(this.texKey)) {
      this.textures.remove(this.texKey);
    }

    const def      = PUZZLES[pIdx % PUZZLES.length];
    const GRID     = def.grid;
    const TILE     = BOARD_SIZE / GRID;   // e.g. 140 for 3×3, 105 for 4×4

    this.nameText.setText(def.name);
    this.movesText.setText('Số lần xoay: 0');

    // ── Draw full image onto a CanvasTexture ──────────────────────────────
    this.texKey = `puzzle_${pIdx}_${Date.now()}`;
    const tex   = this.textures.createCanvas(this.texKey, BOARD_SIZE, BOARD_SIZE)!;
    const htmlCanvas = tex.getSourceImage() as HTMLCanvasElement;
    const ctx   = htmlCanvas.getContext('2d')!;
    def.draw(ctx, BOARD_SIZE);
    tex.refresh();

    // ── Add frames and create tile containers ─────────────────────────────
    for (let row = 0; row < GRID; row++) {
      this.tiles[row] = [];
      for (let col = 0; col < GRID; col++) {
        const frameName = `${row}_${col}`;
        tex.add(frameName, 0, col * TILE, row * TILE, TILE, TILE);

        const cx = BOARD_LEFT + col * TILE + TILE / 2;
        const cy = BOARD_TOP  + row * TILE + TILE / 2;

        // Tile image (cropped portion of full image)
        const img  = this.add.image(0, 0, this.texKey, frameName);

        // Thin border overlay
        const border = this.add.rectangle(0, 0, TILE, TILE)
          .setStrokeStyle(2, 0x000000, 0.6)
          .setFillStyle(0x000000, 0);

        // Invisible hit area
        const hit = this.add.rectangle(0, 0, TILE - 2, TILE - 2, 0x000000, 0)
          .setInteractive({ useHandCursor: true });

        const container = this.add.container(cx, cy, [img, border, hit]);

        // Randomise rotation: must be non-zero so puzzle is never pre-solved
        const rots = [90, 180, 270];
        const currentRot = rots[Phaser.Math.Between(0, 2)];
        container.setAngle(currentRot);

        // Entrance animation
        container.setScale(0.6).setAlpha(0);
        this.tweens.add({
          targets: container, scaleX: 1, scaleY: 1, alpha: 1,
          ease: 'Back.easeOut', duration: 280,
          delay: (row * GRID + col) * 40,
        });

        hit.on('pointerover',  () => { if (!this.solved) border.setStrokeStyle(3, 0xf1c40f, 0.9); });
        hit.on('pointerout',   () => { if (!this.solved) border.setStrokeStyle(2, 0x000000, 0.6); });
        hit.on('pointerdown',  () => this.rotateTile(row, col, border));

        this.tiles[row][col] = { container, currentRot };
      }
    }
  }

  // ── Rotate a tile 90° clockwise ────────────────────────────────────────────
  private rotateTile(row: number, col: number, border: Phaser.GameObjects.Rectangle) {
    if (this.solved) return;
    const tile = this.tiles[row][col];
    tile.currentRot = (tile.currentRot + 90) % 360;
    this.moves++;
    this.movesText.setText(`Số lần xoay: ${this.moves}`);

    this.tweens.add({
      targets: tile.container,
      angle: tile.container.angle + 90,
      ease: 'Cubic.easeOut', duration: 180,
      onComplete: () => {
        border.setStrokeStyle(2, 0x000000, 0.6);
        this.checkSolved();
      },
    });
  }

  // ── Check solved (all tiles at 0°) ─────────────────────────────────────────
  private checkSolved() {
    const allZero = this.tiles.every(row => row.every(t => t.currentRot % 360 === 0));
    if (!allZero) return;
    this.solved = true;

    // Flash green borders
    this.tiles.forEach((row, ri) => row.forEach((t, ci) => {
      const border = t.container.getAt(1) as Phaser.GameObjects.Rectangle;
      this.time.delayedCall((ri * this.tiles[ri].length + ci) * 50, () => {
        border.setStrokeStyle(4, 0x2ecc71, 1);
        this.tweens.add({ targets: t.container, scaleX: 1.06, scaleY: 1.06, ease: 'Back.easeOut', duration: 180, yoyo: true });
      });
    }));

    this.time.delayedCall(900, () => this.showWin());
  }

  // ── Win popup ─────────────────────────────────────────────────────────────
  private showWin() {
    const GRID  = PUZZLES[this.puzzleIdx % PUZZLES.length].grid;
    const total = GRID * GRID;
    const stars = this.moves <= total ? '⭐⭐⭐' : this.moves <= total * 2 ? '⭐⭐' : '⭐';

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65).setDepth(20);
    const p = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(21);
    const bg    = this.add.rectangle(0, 0, 320, 310, 0x0d2244).setStrokeStyle(3, 0x3a6a9a);
    const trop  = this.add.text(0, -128, '🎉', { fontSize: '52px' }).setOrigin(0.5);
    const title = this.add.text(0, -68, 'Hoàn thành!', { fontSize: '24px', color: '#f1c40f', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
    const st    = this.add.text(0, -18, stars, { fontSize: '36px' }).setOrigin(0.5);
    const sc    = this.add.text(0, 36, `Số lần xoay: ${this.moves}`, { fontSize: '16px', color: '#ccddff', fontFamily: 'Arial' }).setOrigin(0.5);
    const mkBtn = (label: string, col: number, cy: number, fn: () => void) => {
      const b = this.add.rectangle(0, cy, 210, 44, col).setStrokeStyle(2, 0x5a8aba);
      b.setInteractive({ useHandCursor: true });
      b.on('pointerover', () => b.setAlpha(0.8)); b.on('pointerout', () => b.setAlpha(1));
      b.on('pointerdown', fn);
      const t = this.add.text(0, cy, label, { fontSize: '15px', color: '#fff', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
      return [b, t];
    };
    const [ab, at] = mkBtn('➡ Câu đố tiếp', 0x27ae60, 86, () => { p.destroy(); this.puzzleIdx++; this.loadPuzzle(this.puzzleIdx); });
    const [mb, mt] = mkBtn('🏠 Trang chủ',  0x2c3e50, 138, () => this.goToMenu());
    p.add([bg, trop, title, st, sc, ab, at, mb, mt]);
    p.setScale(0.5).setAlpha(0);
    this.tweens.add({ targets: p, scaleX: 1, scaleY: 1, alpha: 1, ease: 'Back.easeOut', duration: 380 });
  }

  private goToMenu() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(SCENE_KEYS.MENU));
  }
}
