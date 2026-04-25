import * as Phaser from 'phaser';
import { BaseMiniGame, PLAY_TOP, PLAY_CX } from './BaseMiniGame';
import { generateUnlockChallenge, UnlockChallenge } from '../MathKingdomData';
import type { LevelConfig } from '../MathKingdomData';
import type { GuideCharacter } from '../GuideCharacter';

const W = 480;
const CARD_SIZE = 88, CARD_GAP = 8;
const BTN_W = 100, BTN_H = 90;

export class UnlockMiniGame extends BaseMiniGame {
  private ch!:  UnlockChallenge;
  private done = false;

  constructor(s: Phaser.Scene, cfg: LevelConfig, g: GuideCharacter) { super(s, cfg, g); }

  build(): void {
    this.ch = generateUnlockChallenge();
    this.drawInstruction();
    this.showSequence();
    this.buildChoices();
    this.guide.idle();
    this.guide.say('Cái gì tiếp theo? 🤔', 2500);
  }

  private drawInstruction() {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a0a2a, 0.9);
    bg.fillRoundedRect(10, PLAY_TOP + 4, W - 20, 42, 12);
    const t = this.scene.add.text(PLAY_CX, PLAY_TOP + 25, 'Cái gì sẽ tiếp theo?', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);
    this.container.add([bg, t]);
  }

  private showSequence() {
    const items   = [...this.ch.sequence, '?'];
    const n       = items.length;
    const totalW  = n * CARD_SIZE + (n - 1) * CARD_GAP;
    const startX  = PLAY_CX - totalW / 2 + CARD_SIZE / 2;
    const y       = PLAY_TOP + 100 + CARD_SIZE / 2;

    items.forEach((emoji, i) => {
      const x   = startX + i * (CARD_SIZE + CARD_GAP);
      const isQ = emoji === '?';

      const bg = this.scene.add.graphics();
      bg.fillStyle(isQ ? 0x3d0d5a : 0x2a1040);
      bg.fillRoundedRect(x - CARD_SIZE / 2, y - CARD_SIZE / 2, CARD_SIZE, CARD_SIZE, 16);
      bg.lineStyle(isQ ? 3 : 2, isQ ? 0xf1c40f : 0x6a3a9a);
      bg.strokeRoundedRect(x - CARD_SIZE / 2, y - CARD_SIZE / 2, CARD_SIZE, CARD_SIZE, 16);

      const txt = this.scene.add.text(x, y, emoji, {
        fontSize: isQ ? '44px' : '52px',
        fontFamily: 'Arial',
        color: isQ ? '#f1c40f' : '#ffffff',
      }).setOrigin(0.5);

      this.container.add([bg, txt]);
      this.popIn(txt, i * 100);
    });
  }

  private buildChoices() {
    const BTN_GAP = 10;
    const startX  = PLAY_CX - (2 * BTN_W + BTN_GAP) / 2;
    const startY  = PLAY_TOP + 260;

    this.ch.choices.forEach((emoji, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const cx  = startX + col * (BTN_W + BTN_GAP) + BTN_W / 2;
      const cy  = startY + row * (BTN_H + BTN_GAP) + BTN_H / 2;

      const bg = this.scene.add.graphics();
      bg.fillStyle(0x2a0a5a);
      bg.fillRoundedRect(cx - BTN_W / 2, cy - BTN_H / 2, BTN_W, BTN_H, 16);
      bg.lineStyle(2, 0x7a4aaa);
      bg.strokeRoundedRect(cx - BTN_W / 2, cy - BTN_H / 2, BTN_W, BTN_H, 16);
      bg.setInteractive(
        new Phaser.Geom.Rectangle(cx - BTN_W / 2, cy - BTN_H / 2, BTN_W, BTN_H),
        Phaser.Geom.Rectangle.Contains,
      );
      bg.on('pointerover', () => { if (!this.done) bg.setAlpha(0.8); });
      bg.on('pointerout',  () => bg.setAlpha(1));
      bg.on('pointerdown', () => this.handleTap(emoji, bg, cx, cy));

      const txt = this.scene.add.text(cx, cy, emoji, { fontSize: '48px' }).setOrigin(0.5);
      this.container.add([bg, txt]);
      this.popIn(bg, 400 + i * 80);
      this.popIn(txt, 400 + i * 80);
    });
  }

  private handleTap(emoji: string, bg: Phaser.GameObjects.Graphics, cx: number, cy: number) {
    if (this.done) return;
    if (emoji === this.ch.answer) {
      this.done = true;
      bg.clear();
      bg.fillStyle(0x27ae60);
      bg.fillRoundedRect(cx - BTN_W / 2, cy - BTN_H / 2, BTN_W, BTN_H, 16);
      this.scene.tweens.add({ targets: bg, scaleX: 1.15, scaleY: 1.15, ease: 'Back.easeOut', duration: 200, yoyo: true });
      this.guide.happy();
      this.playUnlockAnimation(() => this.finish(true));
    } else {
      this.attempts++;
      this.guide.thinking();
      this.scene.tweens.add({
        targets: bg, x: { from: cx - 8, to: cx + 8 },
        ease: 'Sine.inOut', duration: 55, repeat: 4, yoyo: true,
        onComplete: () => { bg.x = 0; },
      });
    }
  }

  private playUnlockAnimation(onDone: () => void) {
    const cx = PLAY_CX, cy = PLAY_TOP + 520;
    const lock = this.scene.add.text(cx, cy, '🔒', { fontSize: '72px' }).setOrigin(0.5);
    this.container.add(lock);
    this.scene.tweens.add({
      targets: lock, scaleX: 1.4, scaleY: 1.4, ease: 'Back.easeOut',
      duration: 300, yoyo: true,
      onComplete: () => {
        lock.setText('🔓');
        this.scene.tweens.add({
          targets: lock, scaleX: 1.4, scaleY: 1.4, alpha: 0,
          ease: 'Back.easeOut', duration: 500, delay: 300,
          onComplete: () => { lock.destroy(); onDone(); },
        });
      },
    });
  }

  showHint(): void {
    this.guide.pointLeft();
    this.guide.say('Nhìn quy luật trong dãy nhé! 👀', 2500);
  }
}
