import * as Phaser from 'phaser';
import { BaseMiniGame, PLAY_TOP, PLAY_CX } from './BaseMiniGame';
import { generateCountByColorQuestion } from '../MathKingdomData';
import type { LevelConfig, ColoredObject } from '../MathKingdomData';
import type { GuideCharacter } from '../GuideCharacter';

const W = 480;
const BTN_W = 100, BTN_H = 90, BTN_GAP = 8;

export class CountByColorMiniGame extends BaseMiniGame {
  private qData!: ReturnType<typeof generateCountByColorQuestion>;
  private done = false;

  constructor(s: Phaser.Scene, cfg: LevelConfig, g: GuideCharacter) { super(s, cfg, g); }

  build(): void {
    this.qData = generateCountByColorQuestion(this.cfg);
    this.drawInstruction();
    this.spawnObjects();
    this.buildChoices();
    this.guide.idle();
    this.guide.say(`Đếm chỉ màu ${this.qData.targetColor.name}! ${this.qData.targetColor.emoji}`, 2500);
  }

  private drawInstruction() {
    const color = this.qData.targetColor;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0f2040, 0.9);
    bg.fillRoundedRect(10, PLAY_TOP + 4, W - 20, 52, 12);
    const txt = this.scene.add.text(PLAY_CX, PLAY_TOP + 30, `Đếm màu ${color.emoji} ${color.name}:`, {
      fontSize: '19px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);
    this.container.add([bg, txt]);
  }

  private spawnObjects() {
    const objs  = this.qData.objects;
    const cols  = 5;
    const rows  = Math.ceil(objs.length / cols);
    const cellW = Math.min(80, (W - 20) / cols);
    const cellH = Math.min(72, 260 / rows);
    const gridW = cols * cellW;
    const startX = PLAY_CX - gridW / 2 + cellW / 2;
    const startY = PLAY_TOP + 72;

    objs.forEach((obj: ColoredObject, i: number) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x   = startX + col * cellW;
      const y   = startY + row * cellH;

      // Colored circle behind emoji
      const circle = this.scene.add.arc(x, y, 28, 0, 360, false,
        Phaser.Display.Color.HexStringToColor(obj.color.hex).color, 0.85);

      const t = this.scene.add.text(x, y, obj.emoji, { fontSize: '36px' }).setOrigin(0.5);
      this.container.add([circle, t]);
      this.popIn(t, i * 50);
    });
  }

  private buildChoices() {
    const correct = this.qData.correctCount;
    const set     = new Set<number>([correct]);
    while (set.size < 4) {
      const d = Math.max(1, correct + Math.floor(Math.random() * 6) - 3);
      if (d !== correct) set.add(d);
    }
    const choices = [...set].sort(() => Math.random() - 0.5);

    const totalW  = 2 * BTN_W + BTN_GAP;
    const startX  = PLAY_CX - totalW / 2;
    const startY  = PLAY_TOP + 366;

    choices.forEach((n, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const cx  = startX + col * (BTN_W + BTN_GAP) + BTN_W / 2;
      const cy  = startY + row * (BTN_H + BTN_GAP) + BTN_H / 2;

      const bg = this.scene.add.graphics();
      bg.fillStyle(0x1e3799);
      bg.fillRoundedRect(cx - BTN_W / 2, cy - BTN_H / 2, BTN_W, BTN_H, 16);
      bg.lineStyle(2, 0x4a69bd);
      bg.strokeRoundedRect(cx - BTN_W / 2, cy - BTN_H / 2, BTN_W, BTN_H, 16);
      bg.setInteractive(
        new Phaser.Geom.Rectangle(cx - BTN_W / 2, cy - BTN_H / 2, BTN_W, BTN_H),
        Phaser.Geom.Rectangle.Contains,
      );
      bg.on('pointerover', () => { if (!this.done) bg.setAlpha(0.8); });
      bg.on('pointerout',  () => bg.setAlpha(1));
      bg.on('pointerdown', () => this.handleTap(n, bg, cx, cy));

      const txt = this.scene.add.text(cx, cy, String(n), {
        fontSize: '50px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(0.5);

      this.container.add([bg, txt]);
      this.popIn(bg, 400 + i * 60);
      this.popIn(txt, 400 + i * 60);
    });
  }

  private handleTap(n: number, bg: Phaser.GameObjects.Graphics, cx: number, cy: number) {
    if (this.done) return;
    if (n === this.qData.correctCount) {
      this.done = true;
      bg.clear();
      bg.fillStyle(0x27ae60);
      bg.fillRoundedRect(cx - BTN_W / 2, cy - BTN_H / 2, BTN_W, BTN_H, 16);
      this.scene.tweens.add({
        targets: bg, scaleX: 1.1, scaleY: 1.1, ease: 'Back.easeOut',
        duration: 200, yoyo: true,
      });
      this.guide.happy();
      this.scene.time.delayedCall(700, () => this.finish(true));
    } else {
      this.attempts++;
      this.guide.thinking();
      this.scene.tweens.add({
        targets: bg, x: { from: cx - 8, to: cx + 8 },
        ease: 'Sine.inOut', duration: 55, repeat: 4, yoyo: true,
      });
    }
  }

  showHint(): void {
    this.guide.pointUp();
    const t = this.qData.targetColor;
    this.guide.say(`Chỉ đếm ${t.emoji} màu ${t.name} thôi nhé!`, 2500);
  }
}
