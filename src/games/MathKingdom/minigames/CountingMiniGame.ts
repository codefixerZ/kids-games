import * as Phaser from 'phaser';
import { BaseMiniGame, PLAY_TOP, PLAY_CX } from './BaseMiniGame';
import { generateCountingQuestion, CountingQuestion } from '../MathKingdomData';
import type { LevelConfig } from '../MathKingdomData';
import type { GuideCharacter } from '../GuideCharacter';

// GAME_WIDTH = 480
const W = 480;

export class CountingMiniGame extends BaseMiniGame {
  private q!:      CountingQuestion;
  private choiceBgs: Phaser.GameObjects.Graphics[] = [];
  private counting = false;

  constructor(s: Phaser.Scene, cfg: LevelConfig, g: GuideCharacter) { super(s, cfg, g); }

  build(): void {
    this.q = generateCountingQuestion(this.cfg);
    this.drawInstruction();
    this.spawnObjects();
    this.buildChoices();
    this.guide.idle();
    this.guide.say('Đếm và chọn số nhé! 🔢', 2500);
  }

  private drawInstruction() {
    const y = PLAY_TOP + 14;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0f2040, 0.8);
    bg.fillRoundedRect(20, y, W - 40, 44, 12);
    const txt = this.scene.add.text(PLAY_CX, y + 22, this.cfg.title, {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);
    this.container.add([bg, txt]);
  }

  private spawnObjects() {
    const count  = this.q.objects.length;
    const obj    = this.q.objects[0];
    // Centre objects between instruction and buttons
    const areaTop = PLAY_TOP + 72;
    const areaBot = PLAY_TOP + 350;
    const cols   = Math.min(count, 4);
    const rows   = Math.ceil(count / cols);
    const cellW  = Math.min(90, (W - 40) / cols);
    const cellH  = Math.min(90, (areaBot - areaTop) / rows);
    const gridW  = cols * cellW;
    const gridH  = rows * cellH;
    const startX = PLAY_CX - gridW / 2 + cellW / 2;
    const startY = areaTop + (areaBot - areaTop - gridH) / 2 + cellH / 2;

    for (let i = 0; i < count; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const x = startX + col * cellW, y = startY + row * cellH;

      // Placeholder image slot: this.scene.add.image(x, y, 'mk_obj_' + obj.label)
      const t = this.scene.add.text(x, y, obj.emoji, { fontSize: '54px' }).setOrigin(0.5);
      t.setData('idx', i);
      this.container.add(t);
      this.popIn(t, i * 80);
    }
  }

  private buildChoices() {
    const BTN_W = 96, BTN_H = 96, GAP = 10;
    const totalW = 2 * BTN_W + GAP;
    const startX = PLAY_CX - totalW / 2;
    const startY = PLAY_TOP + 422;
    this.choiceBgs = [];

    this.q.choices.forEach((n, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const cx  = startX + col * (BTN_W + GAP) + BTN_W / 2;
      const cy  = startY + row * (BTN_H + GAP) + BTN_H / 2;

      const bg = this.scene.add.graphics();
      bg.fillStyle(0x1e3799);
      bg.fillRoundedRect(cx - BTN_W / 2, cy - BTN_H / 2, BTN_W, BTN_H, 18);
      bg.lineStyle(3, 0x4a69bd);
      bg.strokeRoundedRect(cx - BTN_W / 2, cy - BTN_H / 2, BTN_W, BTN_H, 18);
      bg.setInteractive(
        new Phaser.Geom.Rectangle(cx - BTN_W / 2, cy - BTN_H / 2, BTN_W, BTN_H),
        Phaser.Geom.Rectangle.Contains,
      );
      bg.on('pointerover', () => { if (!this.counting) bg.setAlpha(0.8); });
      bg.on('pointerout',  () => bg.setAlpha(1));
      bg.on('pointerdown', () => this.handleTap(n, bg, cx, cy, i));

      const txt = this.scene.add.text(cx, cy, String(n), {
        fontSize: '52px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(0.5);

      this.container.add([bg, txt]);
      this.choiceBgs.push(bg);
      this.popIn(bg, 400 + i * 60);
      this.popIn(txt, 400 + i * 60);
    });
  }

  private handleTap(n: number, bg: Phaser.GameObjects.Graphics, cx: number, cy: number, idx: number) {
    if (this.counting) return;

    if (n === this.q.count) {
      this.counting = true;
      this.disableAll();
      // Flash correct
      bg.clear();
      bg.fillStyle(0x27ae60);
      bg.fillRoundedRect(cx - 48, cy - 48, 96, 96, 18);
      this.scene.tweens.add({
        targets: bg, scaleX: 1.15, scaleY: 1.15, ease: 'Back.easeOut',
        duration: 200, yoyo: true,
      });
      this.guide.happy();
      this.animateCounting(() => this.finish(true));
    } else {
      this.attempts++;
      this.guide.thinking();
      // Shake wrong button
      const origX = cx;
      this.scene.tweens.add({
        targets: bg, x: { from: origX - 8, to: origX + 8 },
        ease: 'Sine.inOut', duration: 55, repeat: 4, yoyo: true,
        onComplete: () => {
          // Highlight correct one
          const correctIdx = this.q.choices.indexOf(this.q.count);
          this.flashHint(correctIdx);
        },
      });
    }
  }

  private animateCounting(onDone: () => void) {
    let step = 0;
    const objs = this.container.list.filter(
      o => o instanceof Phaser.GameObjects.Text && (o as Phaser.GameObjects.Text).getData('idx') !== undefined,
    ) as Phaser.GameObjects.Text[];

    const next = () => {
      if (step >= objs.length) { this.scene.time.delayedCall(500, onDone); return; }
      const t = objs[step];
      const glow = this.scene.add.arc(
        (this.container.x || 0) + t.x, (this.container.y || 0) + t.y, 38, 0, 360, false, 0xf1c40f, 0.3,
      );
      this.scene.tweens.add({
        targets: t, scaleX: 1.3, scaleY: 1.3, ease: 'Back.easeOut',
        duration: 200, yoyo: true, delay: 0,
        onComplete: () => { glow.destroy(); step++; next(); },
      });
    };
    next();
  }

  private flashHint(correctIdx: number) {
    const bg = this.choiceBgs[correctIdx];
    if (!bg) return;
    bg.setAlpha(0.4);
    this.scene.tweens.add({ targets: bg, alpha: 1, duration: 400, repeat: 1, yoyo: true });
  }

  private disableAll() {
    this.choiceBgs.forEach(b => b.disableInteractive());
  }

  showHint(): void {
    this.guide.pointUp();
    this.guide.say('Hãy đếm từng con một nhé! 👆', 2500);
    // Animate objects one by one
    const objs = this.container.list.filter(
      o => o instanceof Phaser.GameObjects.Text &&
           (o as Phaser.GameObjects.Text).getData('idx') !== undefined,
    ) as Phaser.GameObjects.Text[];
    objs.forEach((t, i) => {
      this.scene.time.delayedCall(i * 350, () => {
        this.scene.tweens.add({ targets: t, scaleX: 1.4, scaleY: 1.4, ease: 'Back.easeOut', duration: 200, yoyo: true });
      });
    });
  }
}
