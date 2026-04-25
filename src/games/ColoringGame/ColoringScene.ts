import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS } from '../../config';

// ── Layout ────────────────────────────────────────────────────────────────────
const HEADER_H   = 45;
const PALETTE_H  = 70;
const CANVAS_TOP = HEADER_H + PALETTE_H + 4;
const CANVAS_H   = GAME_HEIGHT - CANVAS_TOP - 60; // leave room for bottom toolbar
const CANVAS_W   = GAME_WIDTH;

// ── Colour palette ────────────────────────────────────────────────────────────
const PALETTE = [
  '#e74c3c','#e67e22','#f1c40f','#2ecc71',
  '#1abc9c','#3498db','#9b59b6','#e91e8c',
  '#ffffff','#cccccc','#888888','#333333',
  '#a0522d','#ff9ff3','#00d2d3','#000000',
];

// ── Coloring templates: drawn with Graphics as filled regions ─────────────────
interface Template {
  name: string;
  draw: (scene: ColoringScene, rt: Phaser.GameObjects.RenderTexture) => void;
}

export class ColoringScene extends Phaser.Scene {
  private rt!:           Phaser.GameObjects.RenderTexture;
  private overlayCanvas!: HTMLCanvasElement;
  private overlayCtx!:   CanvasRenderingContext2D;
  private activeColor    = '#e74c3c';
  private brushSize      = 18;
  private templateIdx    = 0;
  private isDrawing      = false;
  private lastX          = 0;
  private lastY          = 0;
  private colorSwatches: Phaser.GameObjects.Rectangle[] = [];
  private selectedSwatch!: Phaser.GameObjects.Rectangle;
  private brushSizeText!: Phaser.GameObjects.Text;

  constructor() { super({ key: SCENE_KEYS.COLORING }); }

  create() {
    this.drawBackground();
    this.drawHeader();
    this.drawPalette();
    this.createOverlayCanvas();
    this.drawTemplate();
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

    const swatchSize  = 32;
    const cols        = 8;
    const totalW      = cols * swatchSize + (cols - 1) * 4;
    const startX      = (GAME_WIDTH - totalW) / 2;
    const row1Y       = HEADER_H + 10;
    const row2Y       = HEADER_H + 10 + swatchSize + 4;

    this.colorSwatches = [];

    PALETTE.forEach((hex, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x   = startX + col * (swatchSize + 4) + swatchSize / 2;
      const y   = (row === 0 ? row1Y : row2Y) + swatchSize / 2;

      const swatch = this.add.rectangle(x, y, swatchSize, swatchSize, Phaser.Display.Color.HexStringToColor(hex).color)
        .setStrokeStyle(i === 0 ? 3 : 1, i === 0 ? 0xffffff : 0x444466)
        .setInteractive({ useHandCursor: true });

      swatch.on('pointerdown', () => {
        this.activeColor = hex;
        this.colorSwatches.forEach(s => s.setStrokeStyle(1, 0x444466));
        swatch.setStrokeStyle(3, 0xffffff);
        this.selectedSwatch = swatch;
      });

      if (i === 0) this.selectedSwatch = swatch;
      this.colorSwatches.push(swatch);
    });
  }

  // ── HTML Canvas overlay for drawing ────────────────────────────────────────
  private createOverlayCanvas() {
    // Create a transparent HTML canvas on top of the Phaser canvas for drawing
    const phaserCanvas = this.game.canvas;
    const parent = phaserCanvas.parentElement!;

    // Remove existing overlay if any
    const existing = parent.querySelector('#coloring-overlay') as HTMLCanvasElement;
    if (existing) existing.remove();

    const overlay = document.createElement('canvas');
    overlay.id    = 'coloring-overlay';
    overlay.width  = GAME_WIDTH;
    overlay.height = GAME_HEIGHT;

    // Match Phaser canvas transform/position
    const scaleX = phaserCanvas.offsetWidth  / GAME_WIDTH;
    const scaleY = phaserCanvas.offsetHeight / GAME_HEIGHT;

    overlay.style.position        = 'absolute';
    overlay.style.left            = phaserCanvas.offsetLeft + 'px';
    overlay.style.top             = phaserCanvas.offsetTop  + 'px';
    overlay.style.width           = phaserCanvas.offsetWidth  + 'px';
    overlay.style.height          = phaserCanvas.offsetHeight + 'px';
    overlay.style.transformOrigin = '0 0';
    overlay.style.cursor          = 'crosshair';
    overlay.style.touchAction     = 'none';
    overlay.style.zIndex          = '5';
    parent.style.position         = 'relative';
    parent.appendChild(overlay);

    this.overlayCanvas = overlay;
    this.overlayCtx    = overlay.getContext('2d')!;

    // Draw initial white background for canvas area
    this.overlayCtx.fillStyle = '#fdf6e3';
    this.overlayCtx.fillRect(0, CANVAS_TOP, CANVAS_W, CANVAS_H);

    // Draw template outlines
    this.drawTemplateOnOverlay();

    // Pointer events (scaled)
    const toCanvas = (e: PointerEvent) => {
      const rect = overlay.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (GAME_WIDTH  / overlay.offsetWidth),
        y: (e.clientY - rect.top)  * (GAME_HEIGHT / overlay.offsetHeight),
      };
    };

    overlay.addEventListener('pointerdown', (e) => {
      const { x, y } = toCanvas(e);
      if (y < CANVAS_TOP) return;   // ignore header/palette area
      this.isDrawing = true;
      this.lastX = x; this.lastY = y;
      this.paintDot(x, y);
    });

    overlay.addEventListener('pointermove', (e) => {
      if (!this.isDrawing) return;
      const { x, y } = toCanvas(e);
      if (y < CANVAS_TOP) return;
      this.paintLine(this.lastX, this.lastY, x, y);
      this.lastX = x; this.lastY = y;
    });

    overlay.addEventListener('pointerup',     () => { this.isDrawing = false; });
    overlay.addEventListener('pointerleave',  () => { this.isDrawing = false; });

    // Clean up when scene shuts down
    this.events.once('shutdown', () => overlay.remove());
    this.events.once('destroy',  () => overlay.remove());
  }

  private paintDot(x: number, y: number) {
    const ctx = this.overlayCtx;
    ctx.beginPath();
    ctx.arc(x, y, this.brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = this.activeColor;
    ctx.fill();
  }

  private paintLine(x1: number, y1: number, x2: number, y2: number) {
    const ctx = this.overlayCtx;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = this.activeColor;
    ctx.lineWidth   = this.brushSize;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();
  }

  // ── Templates ─────────────────────────────────────────────────────────────
  private TEMPLATES = [
    { name: '🌻 Hoa Hướng Dương', draw: (ctx: CanvasRenderingContext2D) => {
      const cx = CANVAS_W / 2, cy = CANVAS_TOP + CANVAS_H / 2 - 30;
      // stem
      ctx.beginPath(); ctx.moveTo(cx, cy + 80); ctx.lineTo(cx, cy + 200);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 6; ctx.stroke();
      // petals
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const px = cx + Math.cos(angle) * 90;
        const py = cy + Math.sin(angle) * 90;
        ctx.beginPath(); ctx.ellipse(px, py, 28, 18, angle, 0, Math.PI * 2);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.stroke();
      }
      // center
      ctx.beginPath(); ctx.arc(cx, cy, 55, 0, Math.PI * 2);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.stroke();
      // leaves
      ctx.beginPath(); ctx.ellipse(cx - 40, cy + 130, 30, 15, -0.5, 0, Math.PI * 2);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.stroke();
    }},
    { name: '🐱 Con Mèo', draw: (ctx: CanvasRenderingContext2D) => {
      const cx = CANVAS_W / 2, cy = CANVAS_TOP + 80;
      ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
      // head
      ctx.beginPath(); ctx.arc(cx, cy + 80, 80, 0, Math.PI * 2); ctx.stroke();
      // ears
      ctx.beginPath(); ctx.moveTo(cx - 70, cy + 20); ctx.lineTo(cx - 95, cy - 30); ctx.lineTo(cx - 30, cy + 10); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 70, cy + 20); ctx.lineTo(cx + 95, cy - 30); ctx.lineTo(cx + 30, cy + 10); ctx.closePath(); ctx.stroke();
      // eyes
      ctx.beginPath(); ctx.arc(cx - 28, cy + 65, 14, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + 28, cy + 65, 14, 0, Math.PI * 2); ctx.stroke();
      // nose
      ctx.beginPath(); ctx.moveTo(cx, cy + 95); ctx.lineTo(cx - 8, cy + 108); ctx.lineTo(cx + 8, cy + 108); ctx.closePath(); ctx.stroke();
      // whiskers
      ctx.beginPath(); ctx.moveTo(cx - 80, cy + 102); ctx.lineTo(cx - 20, cy + 100); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 80, cy + 102); ctx.lineTo(cx + 20, cy + 100); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 80, cy + 112); ctx.lineTo(cx - 20, cy + 108); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 80, cy + 112); ctx.lineTo(cx + 20, cy + 108); ctx.stroke();
      // body
      ctx.beginPath(); ctx.ellipse(cx, cy + 240, 70, 100, 0, 0, Math.PI * 2); ctx.stroke();
      // tail
      ctx.beginPath(); ctx.moveTo(cx + 70, cy + 280); ctx.bezierCurveTo(cx + 140, cy + 320, cx + 160, cy + 200, cx + 100, cy + 180); ctx.stroke();
    }},
    { name: '🏠 Ngôi Nhà', draw: (ctx: CanvasRenderingContext2D) => {
      const left = 80, top = CANVAS_TOP + 80, w = CANVAS_W - 160, h = 200;
      ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
      // house body
      ctx.beginPath(); ctx.rect(left, top + 120, w, h); ctx.stroke();
      // roof
      ctx.beginPath(); ctx.moveTo(left - 20, top + 120); ctx.lineTo(CANVAS_W / 2, top); ctx.lineTo(left + w + 20, top + 120); ctx.stroke();
      // door
      const dx = CANVAS_W / 2 - 28, dy = top + 120 + h - 100;
      ctx.beginPath(); ctx.rect(dx, dy, 56, 100); ctx.stroke();
      ctx.beginPath(); ctx.arc(dx + 28, dy, 28, Math.PI, 0); ctx.stroke();
      // windows
      const winY = top + 150;
      ctx.beginPath(); ctx.rect(left + 30, winY, 70, 60); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(left + 65, winY); ctx.lineTo(left + 65, winY + 60); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(left + 30, winY + 30); ctx.lineTo(left + 100, winY + 30); ctx.stroke();
      ctx.beginPath(); ctx.rect(CANVAS_W - left - 100, winY, 70, 60); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(CANVAS_W - left - 65, winY); ctx.lineTo(CANVAS_W - left - 65, winY + 60); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(CANVAS_W - left - 100, winY + 30); ctx.lineTo(CANVAS_W - left - 30, winY + 30); ctx.stroke();
      // chimney
      ctx.beginPath(); ctx.rect(left + w - 100, top + 20, 40, 100); ctx.stroke();
      // ground
      ctx.beginPath(); ctx.moveTo(20, top + 120 + h); ctx.lineTo(CANVAS_W - 20, top + 120 + h); ctx.stroke();
      // sun
      ctx.beginPath(); ctx.arc(CANVAS_W - 60, CANVAS_TOP + 30, 30, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(CANVAS_W - 60 + Math.cos(a) * 36, CANVAS_TOP + 30 + Math.sin(a) * 36);
        ctx.lineTo(CANVAS_W - 60 + Math.cos(a) * 46, CANVAS_TOP + 30 + Math.sin(a) * 46);
        ctx.stroke();
      }
    }},
    { name: '🦋 Con Bướm', draw: (ctx: CanvasRenderingContext2D) => {
      const cx = CANVAS_W / 2, cy = CANVAS_TOP + CANVAS_H / 2 - 20;
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
      // upper wings
      ctx.beginPath(); ctx.ellipse(cx - 80, cy - 40, 80, 55, -0.4, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx + 80, cy - 40, 80, 55, 0.4, 0, Math.PI * 2); ctx.stroke();
      // lower wings
      ctx.beginPath(); ctx.ellipse(cx - 60, cy + 60, 55, 40, 0.4, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx + 60, cy + 60, 55, 40, -0.4, 0, Math.PI * 2); ctx.stroke();
      // body
      ctx.beginPath(); ctx.ellipse(cx, cy + 10, 12, 70, 0, 0, Math.PI * 2); ctx.stroke();
      // antennae
      ctx.beginPath(); ctx.moveTo(cx - 8, cy - 60); ctx.quadraticCurveTo(cx - 50, cy - 130, cx - 40, cy - 160); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 8, cy - 60); ctx.quadraticCurveTo(cx + 50, cy - 130, cx + 40, cy - 160); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx - 40, cy - 162, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + 40, cy - 162, 7, 0, Math.PI * 2); ctx.stroke();
    }},
  ];

  private drawTemplateOnOverlay() {
    const ctx = this.overlayCtx;
    // Clear canvas area
    ctx.fillStyle = '#fdf6e3';
    ctx.fillRect(0, CANVAS_TOP, CANVAS_W, CANVAS_H);
    // Draw template
    const t = this.TEMPLATES[this.templateIdx % this.TEMPLATES.length];
    ctx.save();
    t.draw(ctx);
    ctx.restore();
  }

  private drawTemplate() {
    // No-op: drawing is done on the overlay canvas
  }

  // ── Bottom bar ─────────────────────────────────────────────────────────────
  private drawBottomBar() {
    const barY = GAME_HEIGHT - 50;
    this.add.rectangle(GAME_WIDTH / 2, barY, GAME_WIDTH, 60, 0x0a1628).setDepth(15);

    // Brush size -/+
    this.brushSizeText = this.add.text(GAME_WIDTH / 2, barY, `✏️ ${this.brushSize}`, {
      fontSize: '14px', color: '#fff', fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(16);

    const mkBtn = (label: string, bx: number, fn: () => void, col = 0x2c3e50) => {
      const b = this.add.rectangle(bx, barY, 60, 38, col)
        .setStrokeStyle(1, 0x5a8aba).setInteractive({ useHandCursor: true }).setDepth(16);
      b.on('pointerover', () => b.setAlpha(0.8)); b.on('pointerout', () => b.setAlpha(1));
      b.on('pointerdown', fn);
      this.add.text(bx, barY, label, { fontSize: '13px', color: '#fff', fontFamily: 'Arial', fontStyle: 'bold' })
        .setOrigin(0.5).setDepth(17);
      return b;
    };

    mkBtn('−', GAME_WIDTH / 2 - 52, () => {
      this.brushSize = Math.max(4, this.brushSize - 4);
      this.brushSizeText.setText(`✏️ ${this.brushSize}`);
    });
    mkBtn('+', GAME_WIDTH / 2 + 52, () => {
      this.brushSize = Math.min(60, this.brushSize + 4);
      this.brushSizeText.setText(`✏️ ${this.brushSize}`);
    });
    mkBtn('🗑️', 60, () => this.clearCanvas(), 0xc0392b);
    mkBtn('➡', GAME_WIDTH - 60, () => { this.templateIdx++; this.drawTemplateOnOverlay(); }, 0x27ae60);
    mkBtn('💾', GAME_WIDTH - 128, () => this.saveImage(), 0x2980b9);
  }

  private clearCanvas() {
    const ctx = this.overlayCtx;
    ctx.fillStyle = '#fdf6e3';
    ctx.fillRect(0, CANVAS_TOP, CANVAS_W, CANVAS_H);
    this.drawTemplateOnOverlay();
  }

  private saveImage() {
    const link = document.createElement('a');
    link.download = `to-mau-${Date.now()}.png`;
    link.href = this.overlayCanvas.toDataURL('image/png');
    link.click();
  }

  private goToMenu() {
    if (this.overlayCanvas?.parentElement) {
      this.overlayCanvas.remove();
    }
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(SCENE_KEYS.MENU));
  }
}
