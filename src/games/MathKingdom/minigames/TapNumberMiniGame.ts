import * as Phaser from 'phaser';
import { BaseMiniGame, PLAY_TOP, PLAY_CX } from './BaseMiniGame';
import { generateTapNumberQuestion, TapNumberQuestion } from '../MathKingdomData';
import type { LevelConfig } from '../MathKingdomData';
import type { GuideCharacter } from '../GuideCharacter';

const W = 480;
const ROW_H = 108, ROW_GAP = 8;

export class TapNumberMiniGame extends BaseMiniGame {
  private q!:    TapNumberQuestion;
  private rows:  { bg: Phaser.GameObjects.Graphics; cy: number }[] = [];
  private done = false;

  constructor(s: Phaser.Scene, cfg: LevelConfig, g: GuideCharacter) { super(s, cfg, g); }

  build(): void {
    this.q = generateTapNumberQuestion(this.cfg);
    this.drawTarget();
    this.buildRows();
    this.guide.idle();
    this.guide.say('Tìm nhóm có đúng số con! 🔍', 2500);
  }

  private drawTarget() {
    const y = PLAY_TOP + 8;
    // Background panel
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x8e44ad, 0.9);
    bg.fillRoundedRect(W / 2 - 70, y, 140, 86, 20);
    // Big number
    const num = this.scene.add.text(PLAY_CX, y + 44, String(this.q.targetNumber), {
      fontSize: '64px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);
    // "Find:" label
    const label = this.scene.add.text(PLAY_CX, y - 14, 'Tìm nhóm có:', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ccccff',
    }).setOrigin(0.5);
    this.container.add([bg, label, num]);
    this.popIn(bg);
    this.popIn(num, 120);
  }

  private buildRows() {
    const startY = PLAY_TOP + 116;
    this.rows = [];

    this.q.rows.forEach((row, i) => {
      const cy  = startY + i * (ROW_H + ROW_GAP) + ROW_H / 2;
      const bg  = this.scene.add.graphics();
      bg.fillStyle(0x1a2a4a);
      bg.fillRoundedRect(14, cy - ROW_H / 2, W - 28, ROW_H, 14);
      bg.lineStyle(2, 0x2a4a7a);
      bg.strokeRoundedRect(14, cy - ROW_H / 2, W - 28, ROW_H, 14);
      bg.setInteractive(
        new Phaser.Geom.Rectangle(14, cy - ROW_H / 2, W - 28, ROW_H),
        Phaser.Geom.Rectangle.Contains,
      );
      bg.on('pointerover', () => { if (!this.done) { bg.clear(); bg.fillStyle(0x253a5e); bg.fillRoundedRect(14, cy - ROW_H / 2, W - 28, ROW_H, 14); } });
      bg.on('pointerout',  () => { if (!this.done) { bg.clear(); bg.fillStyle(0x1a2a4a); bg.fillRoundedRect(14, cy - ROW_H / 2, W - 28, ROW_H, 14); bg.lineStyle(2, 0x2a4a7a); bg.strokeRoundedRect(14, cy - ROW_H / 2, W - 28, ROW_H, 14); } });
      bg.on('pointerdown', () => this.handleTap(row.count, bg, cy, i));

      // Objects in row
      const spacing = Math.min(60, (W - 60) / row.count);
      const totalW  = (row.count - 1) * spacing;
      const startX  = PLAY_CX - totalW / 2;
      for (let k = 0; k < row.count; k++) {
        const tx = startX + k * spacing;
        const t  = this.scene.add.text(tx, cy, row.obj.emoji, { fontSize: '42px' }).setOrigin(0.5);
        this.container.add(t);
      }

      this.container.add(bg);
      this.popIn(bg, i * 100);
      this.rows.push({ bg, cy });
    });
  }

  private handleTap(count: number, bg: Phaser.GameObjects.Graphics, cy: number, i: number) {
    if (this.done) return;

    if (count === this.q.targetNumber) {
      this.done = true;
      this.disableAll();
      bg.clear();
      bg.fillStyle(0x27ae60);
      bg.fillRoundedRect(14, cy - ROW_H / 2, W - 28, ROW_H, 14);
      this.scene.tweens.add({ targets: bg, scaleX: 1.02, scaleY: 1.02, ease: 'Back.easeOut', duration: 180, yoyo: true });
      this.guide.happy();
      this.scene.time.delayedCall(700, () => this.finish(true));
    } else {
      this.attempts++;
      this.guide.thinking();
      const origX = 0;
      this.scene.tweens.add({
        targets: bg, x: { from: origX - 8, to: origX + 8 },
        ease: 'Sine.inOut', duration: 55, repeat: 4, yoyo: true,
        onComplete: () => { bg.x = origX; },
      });
      // Pulse the correct row
      this.scene.time.delayedCall(500, () => {
        const ci = this.q.rows.findIndex(r => r.count === this.q.targetNumber);
        if (ci >= 0) {
          this.scene.tweens.add({ targets: this.rows[ci].bg, alpha: 0.4, duration: 300, yoyo: true, repeat: 1 });
        }
      });
    }
  }

  private disableAll() { this.rows.forEach(r => r.bg.disableInteractive()); }

  showHint(): void {
    this.guide.pointRight();
    this.guide.say('Đếm số con trong từng hàng! 👉', 2500);
  }
}
