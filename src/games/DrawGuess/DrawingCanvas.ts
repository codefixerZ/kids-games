import * as Phaser from 'phaser';

export class DrawingCanvas {
  private scene: Phaser.Scene;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private brushColor = '#000000';
  private brushSize = 6;
  private isDrawing = false;
  private prevX = 0;
  private prevY = 0;

  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;

  private onResize: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    // Draw the Phaser border rect so the panel background still shows
    scene.add.rectangle(x + width / 2, y + height / 2, width + 4, height + 4, 0xcccccc);

    // Native HTML canvas overlaid on the Phaser canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.position = 'absolute';
    this.canvas.style.cursor = 'crosshair';
    this.canvas.style.borderRadius = '2px';
    document.body.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d')!;
    this.clearCanvas();

    this.onResize = () => this.updatePosition();
    this.updatePosition();
    window.addEventListener('resize', this.onResize);
    // Also reposition after Phaser's scale manager settles
    scene.scale.on('resize', this.onResize);

    this.registerPointerEvents();
  }

  // Calculate where the drawing area sits in screen pixels
  private updatePosition() {
    const phaserCanvas = this.scene.game.canvas;
    const rect = phaserCanvas.getBoundingClientRect();
    const gameW = this.scene.game.config.width as number;
    const gameH = this.scene.game.config.height as number;
    const scaleX = rect.width / gameW;
    const scaleY = rect.height / gameH;

    this.canvas.style.left   = `${rect.left + window.scrollX + this.x * scaleX}px`;
    this.canvas.style.top    = `${rect.top  + window.scrollY + this.y * scaleY}px`;
    this.canvas.style.width  = `${this.width  * scaleX}px`;
    this.canvas.style.height = `${this.height * scaleY}px`;
  }

  private registerPointerEvents() {
    const el = this.canvas;

    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      this.isDrawing = true;
      const { x, y } = this.localCoords(e);
      this.prevX = x;
      this.prevY = y;
      // Draw a dot on click without moving
      this.ctx.beginPath();
      this.ctx.arc(x, y, this.brushSize / 2, 0, Math.PI * 2);
      this.ctx.fillStyle = this.brushColor;
      this.ctx.fill();
    });

    el.addEventListener('pointermove', (e) => {
      if (!this.isDrawing) return;
      const { x, y } = this.localCoords(e);
      this.ctx.beginPath();
      this.ctx.moveTo(this.prevX, this.prevY);
      this.ctx.lineTo(x, y);
      this.ctx.strokeStyle = this.brushColor;
      this.ctx.lineWidth = this.brushSize;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.stroke();
      this.prevX = x;
      this.prevY = y;
    });

    el.addEventListener('pointerup', () => { this.isDrawing = false; });
    el.addEventListener('pointerleave', () => { this.isDrawing = false; });
  }

  // Convert a PointerEvent to canvas-local pixel coords (accounting for CSS scale)
  private localCoords(e: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.width  / rect.width;
    const scaleY = this.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  }

  clearCanvas() {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  setBrushColor(hex: number) {
    // Convert Phaser 0xRRGGBB number to CSS #rrggbb string
    this.brushColor = '#' + hex.toString(16).padStart(6, '0');
  }

  setBrushSize(size: number) {
    this.brushSize = size;
  }

  // Direct canvas element — TensorFlow.js can classify it without any snapshot
  getHTMLCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  // Keep same interface as before — now just returns the canvas directly
  snapshotToCanvas(): Promise<HTMLCanvasElement> {
    return Promise.resolve(this.canvas);
  }

  /** Hide the HTML canvas so Phaser UI underneath (result panel) is visible */
  hide() {
    this.canvas.style.display = 'none';
  }

  /** Show the HTML canvas again for drawing */
  show() {
    this.canvas.style.display = 'block';
  }

  destroy() {
    window.removeEventListener('resize', this.onResize);
    this.scene.scale.off('resize', this.onResize);
    this.canvas.remove();
  }
}
