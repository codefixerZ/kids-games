import * as Phaser from 'phaser';
import { COLORS } from '../../config';

export const BRUSH_COLORS = [
  { hex: 0x000000, label: 'Đen' },
  { hex: 0xe74c3c, label: 'Đỏ' },
  { hex: 0x2ecc71, label: 'Xanh lá' },
  { hex: 0x3498db, label: 'Xanh dương' },
  { hex: 0xf1c40f, label: 'Vàng' },
  { hex: 0x9b59b6, label: 'Tím' },
  { hex: 0xe67e22, label: 'Cam' },
  { hex: 0x795548, label: 'Nâu' },
];

export const BRUSH_SIZES = [3, 6, 12, 20];

export class ToolBar extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private selectedColorDot: Phaser.GameObjects.Arc | null = null;
  private selectedSizeCircle: Phaser.GameObjects.Arc | null = null;
  private eraserBtn!: Phaser.GameObjects.Rectangle;
  private eraserText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super();
    this.scene = scene;

    // Background
    scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0x16213e)
      .setStrokeStyle(1, 0x333355);

    this.container = scene.add.container(x, y);

    // Two rows: top = colors + eraser, bottom = brush sizes + action buttons
    const row1Y = height * 0.28;
    const row2Y = height * 0.73;

    this.buildColorRow(width, row1Y);
    this.buildSizeRow(width, row2Y);
  }

  private buildColorRow(barW: number, cy: number) {
    // 8 color dots evenly spaced on left, eraser button on right
    const dotR = 14;
    const totalColors = BRUSH_COLORS.length;
    const availW = barW - 90; // leave 90px for eraser on the right
    const spacing = availW / totalColors;

    BRUSH_COLORS.forEach((c, i) => {
      const cx = spacing / 2 + i * spacing;
      const dot = this.scene.add.circle(cx, cy, dotR, c.hex);
      dot.setStrokeStyle(2, i === 0 ? 0xffffff : 0x444444);
      dot.setInteractive({ useHandCursor: true });

      if (i === 0) this.selectedColorDot = dot;

      dot.on('pointerdown', () => this.selectColor(dot, c.hex));
      this.container.add(dot);
    });

    // Eraser button
    const ex = barW - 44;
    this.eraserBtn = this.scene.add.rectangle(ex, cy, 72, 28, 0x444455);
    this.eraserBtn.setStrokeStyle(1, 0x888888);
    this.eraserBtn.setInteractive({ useHandCursor: true });

    this.eraserText = this.scene.add.text(ex, cy, '🧹 Tẩy', {
      fontSize: '13px', color: '#cccccc', fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.eraserBtn.on('pointerdown', () => {
      this.selectedColorDot?.setStrokeStyle(2, 0x444444);
      this.selectedColorDot = null;
      this.eraserBtn.setFillStyle(0x666677);
      this.emit('colorChange', 0xffffff);
    });

    this.container.add([this.eraserBtn, this.eraserText]);
  }

  private buildSizeRow(barW: number, cy: number) {
    // 4 brush-size circles on left, Clear + Guess buttons on right
    const sizeStartX = 20;

    BRUSH_SIZES.forEach((size, i) => {
      const cx = sizeStartX + i * 46;
      const outerR = 16;
      const innerR = Math.max(size / 2, 2);

      const outer = this.scene.add.circle(cx, cy, outerR, 0x555566);
      outer.setInteractive({ useHandCursor: true });

      const inner = this.scene.add.circle(cx, cy, innerR, 0x000000);

      if (i === 1) {
        outer.setFillStyle(0xaaaaaa);
        this.selectedSizeCircle = outer;
      }

      outer.on('pointerdown', () => {
        this.selectedSizeCircle?.setFillStyle(0x555566);
        outer.setFillStyle(0xaaaaaa);
        this.selectedSizeCircle = outer;
        this.emit('sizeChange', size);
      });

      this.container.add([outer, inner]);
    });

    // Right-aligned buttons: Clear then Guess
    const btns: { label: string; color: number; event: string; w: number }[] = [
      { label: '🗑 Xóa',   color: 0x555577,      event: 'clear', w: 88 },
      { label: '🤖 Đoán!', color: COLORS.ACCENT,  event: 'guess', w: 100 },
    ];

    let rx = barW - 8;
    for (let i = btns.length - 1; i >= 0; i--) {
      const b = btns[i];
      rx -= b.w / 2;
      this.makeButton(rx, cy, b.w, 34, b.label, b.color, () => this.emit(b.event));
      rx -= b.w / 2 + 8;
    }
  }

  private selectColor(dot: Phaser.GameObjects.Arc, hex: number) {
    this.selectedColorDot?.setStrokeStyle(2, 0x444444);
    dot.setStrokeStyle(3, 0xffffff);
    this.selectedColorDot = dot;
    this.eraserBtn.setFillStyle(0x444455);
    this.emit('colorChange', hex);
  }

  private makeButton(cx: number, cy: number, w: number, h: number, label: string, color: number, onClick: () => void) {
    const bg = this.scene.add.rectangle(cx, cy, w, h, color);
    bg.setStrokeStyle(1, 0xffffff, 0.3);
    bg.setInteractive({ useHandCursor: true });

    const text = this.scene.add.text(cx, cy, label, {
      fontSize: '14px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    bg.on('pointerover',  () => bg.setAlpha(0.8));
    bg.on('pointerout',   () => bg.setAlpha(1));
    bg.on('pointerdown',  onClick);

    this.container.add([bg, text]);
  }
}
