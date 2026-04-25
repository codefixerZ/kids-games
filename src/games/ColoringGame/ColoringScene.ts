import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS } from '../../config';

// ── Layout ────────────────────────────────────────────────────────────────────
const HEADER_H   = 45;
const PALETTE_H  = 70;
const BOTTOM_H   = 56;
const CANVAS_TOP = HEADER_H + PALETTE_H + 4;
const CANVAS_H   = GAME_HEIGHT - CANVAS_TOP - BOTTOM_H - 4;
const CANVAS_W   = GAME_WIDTH;

// ── Colour palette ────────────────────────────────────────────────────────────
const PALETTE = [
  '#e74c3c','#e67e22','#f1c40f','#2ecc71',
  '#1abc9c','#3498db','#9b59b6','#e91e8c',
  '#ffffff','#cccccc','#888888','#333333',
  '#a0522d','#ff9ff3','#00d2d3','#000000',
];

// ── Templates ─────────────────────────────────────────────────────────────────
type DrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
const TEMPLATES: { name: string; draw: DrawFn }[] = [
  {
    name: '🌻 Hoa Hướng Dương',
    draw(ctx, w, h) {
      const cx = w / 2, cy = h * 0.45;
      ctx.lineWidth = 4; ctx.strokeStyle = '#111';
      // stem
      ctx.beginPath(); ctx.moveTo(cx, cy + 80); ctx.lineTo(cx, h - 20); ctx.stroke();
      // leaf
      ctx.beginPath(); ctx.ellipse(cx - 36, cy + 140, 28, 14, -0.5, 0, Math.PI * 2); ctx.stroke();
      // petals
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const px = cx + Math.cos(a) * 96, py = cy + Math.sin(a) * 96;
        ctx.beginPath(); ctx.ellipse(px, py, 22, 14, a, 0, Math.PI * 2); ctx.stroke();
      }
      // center
      ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI * 2); ctx.stroke();
    },
  },
  {
    name: '🐱 Con Mèo',
    draw(ctx, w, h) {
      const cx = w / 2, cy = h * 0.3;
      ctx.lineWidth = 4; ctx.strokeStyle = '#111';
      // body
      ctx.beginPath(); ctx.ellipse(cx, cy + 200, 80, 100, 0, 0, Math.PI * 2); ctx.stroke();
      // head
      ctx.beginPath(); ctx.arc(cx, cy, 90, 0, Math.PI * 2); ctx.stroke();
      // ears
      ctx.beginPath(); ctx.moveTo(cx - 80, cy - 50); ctx.lineTo(cx - 100, cy - 110); ctx.lineTo(cx - 30, cy - 60); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 80, cy - 50); ctx.lineTo(cx + 100, cy - 110); ctx.lineTo(cx + 30, cy - 60); ctx.closePath(); ctx.stroke();
      // eyes
      ctx.beginPath(); ctx.arc(cx - 32, cy - 10, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + 32, cy - 10, 16, 0, Math.PI * 2); ctx.stroke();
      // nose
      ctx.beginPath(); ctx.moveTo(cx, cy + 16); ctx.lineTo(cx - 9, cy + 28); ctx.lineTo(cx + 9, cy + 28); ctx.closePath(); ctx.stroke();
      // whiskers
      for (const dir of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(cx + dir * 12, cy + 22); ctx.lineTo(cx + dir * 84, cy + 16); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + dir * 12, cy + 28); ctx.lineTo(cx + dir * 84, cy + 30); ctx.stroke();
      }
      // tail
      ctx.beginPath(); ctx.moveTo(cx + 76, cy + 260); ctx.bezierCurveTo(cx + 150, cy + 290, cx + 160, cy + 180, cx + 100, cy + 170); ctx.stroke();
    },
  },
  {
    name: '🏠 Ngôi Nhà',
    draw(ctx, w, h) {
      const L = 50, T = 60, W = w - 100, H = 220;
      ctx.lineWidth = 4; ctx.strokeStyle = '#111';
      // house body
      ctx.beginPath(); ctx.rect(L, T + 120, W, H); ctx.stroke();
      // roof
      ctx.beginPath(); ctx.moveTo(L - 20, T + 120); ctx.lineTo(w / 2, T); ctx.lineTo(L + W + 20, T + 120); ctx.stroke();
      // chimney
      ctx.beginPath(); ctx.rect(L + W - 90, T + 20, 36, 100); ctx.stroke();
      // door
      const dx = w / 2 - 28, dy = T + 120 + H - 110;
      ctx.beginPath(); ctx.rect(dx, dy, 56, 110); ctx.stroke();
      ctx.beginPath(); ctx.arc(dx + 28, dy, 28, Math.PI, 0); ctx.stroke();
      // windows (left)
      ctx.beginPath(); ctx.rect(L + 22, T + 148, 72, 60); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(L + 58, T + 148); ctx.lineTo(L + 58, T + 208); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(L + 22, T + 178); ctx.lineTo(L + 94, T + 178); ctx.stroke();
      // windows (right)
      ctx.beginPath(); ctx.rect(w - L - 94, T + 148, 72, 60); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w - L - 58, T + 148); ctx.lineTo(w - L - 58, T + 208); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w - L - 94, T + 178); ctx.lineTo(w - L - 22, T + 178); ctx.stroke();
      // ground
      ctx.beginPath(); ctx.moveTo(10, T + 120 + H); ctx.lineTo(w - 10, T + 120 + H); ctx.stroke();
      // sun
      ctx.beginPath(); ctx.arc(60, 50, 34, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(60 + Math.cos(a) * 40, 50 + Math.sin(a) * 40);
        ctx.lineTo(60 + Math.cos(a) * 52, 50 + Math.sin(a) * 52); ctx.stroke();
      }
    },
  },
  {
    name: '🦋 Con Bướm',
    draw(ctx, w, h) {
      const cx = w / 2, cy = h * 0.52;
      ctx.lineWidth = 4; ctx.strokeStyle = '#111';
      // upper wings
      ctx.beginPath(); ctx.ellipse(cx - 90, cy - 50, 88, 62, -0.35, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx + 90, cy - 50, 88, 62, 0.35, 0, Math.PI * 2); ctx.stroke();
      // wing details
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx - 90, cy - 50, 50, 34, -0.35, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx + 90, cy - 50, 50, 34, 0.35, 0, Math.PI * 2); ctx.stroke();
      // lower wings
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(cx - 66, cy + 68, 60, 44, 0.4, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx + 66, cy + 68, 60, 44, -0.4, 0, Math.PI * 2); ctx.stroke();
      // body
      ctx.beginPath(); ctx.ellipse(cx, cy + 14, 13, 76, 0, 0, Math.PI * 2); ctx.stroke();
      // antennae
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx - 9, cy - 62); ctx.quadraticCurveTo(cx - 54, cy - 140, cx - 44, cy - 172); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 9, cy - 62); ctx.quadraticCurveTo(cx + 54, cy - 140, cx + 44, cy - 172); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx - 44, cy - 174, 8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 44, cy - 174, 8, 0, Math.PI * 2); ctx.fill();
    },
  },
  {
    name: '🐠 Cá Nhiệt Đới',
    draw(ctx, w, h) {
      const cx = w / 2, cy = h / 2;
      ctx.lineWidth = 4; ctx.strokeStyle = '#111';
      // body
      ctx.beginPath(); ctx.ellipse(cx, cy, 110, 70, 0, 0, Math.PI * 2); ctx.stroke();
      // tail fin
      ctx.beginPath(); ctx.moveTo(cx + 108, cy); ctx.lineTo(cx + 180, cy - 60); ctx.lineTo(cx + 180, cy + 60); ctx.closePath(); ctx.stroke();
      // top fin
      ctx.beginPath(); ctx.moveTo(cx - 60, cy - 68); ctx.quadraticCurveTo(cx, cy - 130, cx + 60, cy - 68); ctx.stroke();
      // eye
      ctx.beginPath(); ctx.arc(cx - 65, cy - 18, 18, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx - 65, cy - 18, 7, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 4;
      // stripes
      ctx.beginPath(); ctx.moveTo(cx - 20, cy - 68); ctx.lineTo(cx - 20, cy + 68); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 30, cy - 62); ctx.lineTo(cx + 30, cy + 62); ctx.stroke();
      // bubbles
      ctx.lineWidth = 2;
      for (const [bx, by, br] of [[cx - 130, cy - 80, 10], [cx - 148, cy - 110, 7], [cx - 120, cy - 134, 5]] as [number,number,number][]) {
        ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.stroke();
      }
    },
  },
];

export class ColoringScene extends Phaser.Scene {
  private overlayCanvas!: HTMLCanvasElement;
  private overlayCtx!:   CanvasRenderingContext2D;
  private templateData!: ImageData;
  private activeColor    = '#e74c3c';
  private templateIdx    = 0;
  private colorSwatches: Phaser.GameObjects.Rectangle[] = [];
  private brushSizeText!: Phaser.GameObjects.Text;

  constructor() { super({ key: SCENE_KEYS.COLORING }); }

  create() {
    this.drawBackground();
    this.drawHeader();
    this.drawPalette();
    this.createOverlayCanvas();
    this.drawBottomBar();
  }

  // ── Background ─────────────────────────────────────────────────────────────
  private drawBackground() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e);
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
    this.add.text(GAME_WIDTH / 2, 13, '🎨 Tô Màu', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(10);
  }

  // ── Colour palette ─────────────────────────────────────────────────────────
  private drawPalette() {
    this.add.rectangle(GAME_WIDTH / 2, HEADER_H + PALETTE_H / 2, GAME_WIDTH, PALETTE_H, 0x0f1f3a);
    const swSize = 32, cols = 8, gapX = 4;
    const totalW = cols * swSize + (cols - 1) * gapX;
    const startX = (GAME_WIDTH - totalW) / 2;

    PALETTE.forEach((hex, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = startX + col * (swSize + gapX) + swSize / 2;
      const y = HEADER_H + 10 + row * (swSize + 4) + swSize / 2;
      const swatch = this.add.rectangle(x, y, swSize, swSize,
        Phaser.Display.Color.HexStringToColor(hex).color)
        .setStrokeStyle(i === 0 ? 3 : 1, i === 0 ? 0xffffff : 0x444466)
        .setInteractive({ useHandCursor: true });
      swatch.on('pointerdown', () => {
        this.activeColor = hex;
        this.colorSwatches.forEach(s => s.setStrokeStyle(1, 0x444466));
        swatch.setStrokeStyle(3, 0xffffff);
      });
      this.colorSwatches.push(swatch);
    });
  }

  // ── Overlay canvas (drawing area only — doesn't cover header/palette/bar) ──
  private createOverlayCanvas() {
    const phaserCanvas = this.game.canvas;
    const parent = phaserCanvas.parentElement!;
    parent.style.position = 'relative';

    const existing = parent.querySelector('#coloring-overlay') as HTMLCanvasElement | null;
    if (existing) existing.remove();

    const scaleX = phaserCanvas.offsetWidth  / GAME_WIDTH;
    const scaleY = phaserCanvas.offsetHeight / GAME_HEIGHT;

    const overlay = document.createElement('canvas');
    overlay.id     = 'coloring-overlay';
    overlay.width  = GAME_WIDTH;
    overlay.height = CANVAS_H;           // logical height = drawing area only
    overlay.style.position = 'absolute';
    overlay.style.left   = `${phaserCanvas.offsetLeft}px`;
    overlay.style.top    = `${phaserCanvas.offsetTop + CANVAS_TOP * scaleY}px`;
    overlay.style.width  = `${phaserCanvas.offsetWidth}px`;
    overlay.style.height = `${CANVAS_H * scaleY}px`;  // screen height = scaled drawing area
    overlay.style.cursor      = 'crosshair';
    overlay.style.touchAction = 'none';
    overlay.style.zIndex      = '5';
    parent.appendChild(overlay);

    this.overlayCanvas = overlay;
    this.overlayCtx    = overlay.getContext('2d')!;

    this.drawTemplateOnOverlay();

    // ── Convert client coords → overlay canvas logical coords ──────────────
    const toCanvas = (e: PointerEvent) => {
      const rect = overlay.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (GAME_WIDTH / overlay.offsetWidth),
        y: (e.clientY - rect.top)  * (CANVAS_H  / overlay.offsetHeight),
      };
    };

    overlay.addEventListener('pointerdown', (e) => {
      const { x, y } = toCanvas(e);
      this.floodFill(Math.round(x), Math.round(y));
    });

    this.events.once('shutdown', () => overlay.remove());
    this.events.once('destroy',  () => overlay.remove());
  }

  // ── Draw (or redraw) the current template ──────────────────────────────────
  private drawTemplateOnOverlay() {
    const ctx = this.overlayCtx;
    ctx.fillStyle = '#fdf6e3';
    ctx.fillRect(0, 0, GAME_WIDTH, CANVAS_H);
    const t = TEMPLATES[this.templateIdx % TEMPLATES.length];
    ctx.save();
    t.draw(ctx, GAME_WIDTH, CANVAS_H);
    ctx.restore();
    // Store snapshot so we can restore on clear
    this.templateData = ctx.getImageData(0, 0, GAME_WIDTH, CANVAS_H);
  }

  // ── Scanline flood fill ────────────────────────────────────────────────────
  private floodFill(startX: number, startY: number) {
    const ctx   = this.overlayCtx;
    const W     = GAME_WIDTH;
    const H     = CANVAS_H;
    const imgData = ctx.getImageData(0, 0, W, H);
    const data  = imgData.data;

    if (startX < 0 || startY < 0 || startX >= W || startY >= H) return;

    const base = (startY * W + startX) * 4;
    const tr = data[base], tg = data[base + 1], tb = data[base + 2];

    // Don't fill on dark template lines
    if (tr < 80 && tg < 80 && tb < 80) return;

    // Parse fill colour
    const hex = this.activeColor.replace('#', '');
    const fr = parseInt(hex.slice(0, 2), 16);
    const fg = parseInt(hex.slice(2, 4), 16);
    const fb = parseInt(hex.slice(4, 6), 16);

    // Already filled with same colour?
    if (tr === fr && tg === fg && tb === fb) return;

    const TOL = 36;
    const match = (i: number) =>
      Math.abs(data[i]   - tr) <= TOL &&
      Math.abs(data[i+1] - tg) <= TOL &&
      Math.abs(data[i+2] - tb) <= TOL;

    const visited = new Uint8Array(W * H);
    const stack: [number, number][] = [[startX, startY]];

    while (stack.length) {
      const [x, y] = stack.pop()!;
      if (x < 0 || x >= W || y < 0 || y >= H) continue;
      if (visited[y * W + x]) continue;
      if (!match((y * W + x) * 4)) continue;

      // Scan left
      let lx = x;
      while (lx > 0 && !visited[y * W + (lx - 1)] && match((y * W + lx - 1) * 4)) lx--;
      // Scan right
      let rx = x;
      while (rx < W - 1 && !visited[y * W + (rx + 1)] && match((y * W + rx + 1) * 4)) rx++;

      // Fill span
      for (let cx = lx; cx <= rx; cx++) {
        const pi = (y * W + cx) * 4;
        data[pi] = fr; data[pi+1] = fg; data[pi+2] = fb; data[pi+3] = 255;
        visited[y * W + cx] = 1;
      }

      // Push rows above/below
      for (let cx = lx; cx <= rx; cx++) {
        if (y > 0   && !visited[(y-1)*W+cx] && match(((y-1)*W+cx)*4)) stack.push([cx, y-1]);
        if (y < H-1 && !visited[(y+1)*W+cx] && match(((y+1)*W+cx)*4)) stack.push([cx, y+1]);
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  // ── Bottom bar (Phaser objects — no overlay in this region) ───────────────
  private drawBottomBar() {
    const barY = GAME_HEIGHT - BOTTOM_H / 2;
    this.add.rectangle(GAME_WIDTH / 2, barY, GAME_WIDTH, BOTTOM_H, 0x0a1628).setDepth(15);

    const mkBtn = (label: string, bx: number, fn: () => void, col = 0x2c3e50) => {
      const b = this.add.rectangle(bx, barY, 72, 40, col)
        .setStrokeStyle(1, 0x5a8aba).setInteractive({ useHandCursor: true }).setDepth(16);
      b.on('pointerover', () => b.setAlpha(0.8));
      b.on('pointerout',  () => b.setAlpha(1));
      b.on('pointerdown', fn);
      this.add.text(bx, barY, label, {
        fontSize: '13px', color: '#fff', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(17);
      return b;
    };

    mkBtn('🗑️ Xóa', 52,              () => this.clearCanvas(), 0xc0392b);
    mkBtn('➡ Tiếp', GAME_WIDTH - 52,  () => { this.templateIdx++; this.drawTemplateOnOverlay(); }, 0x27ae60);
    mkBtn('💾 Lưu',  GAME_WIDTH - 134, () => this.saveImage(), 0x2980b9);

    // Current template name
    this.add.text(GAME_WIDTH / 2, barY, TEMPLATES[0].name, {
      fontSize: '12px', color: '#8899bb', fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(17);
  }

  // ── Clear = restore template (no user fills) ───────────────────────────────
  private clearCanvas() {
    if (this.templateData) {
      this.overlayCtx.putImageData(this.templateData, 0, 0);
    }
  }

  private saveImage() {
    const link = document.createElement('a');
    link.download = `to-mau-${Date.now()}.png`;
    link.href = this.overlayCanvas.toDataURL('image/png');
    link.click();
  }

  private goToMenu() {
    this.overlayCanvas?.remove();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(SCENE_KEYS.MENU));
  }
}
