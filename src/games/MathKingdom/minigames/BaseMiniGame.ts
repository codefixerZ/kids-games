import * as Phaser from 'phaser';
import type { LevelConfig } from '../MathKingdomData';
import type { GuideCharacter } from '../GuideCharacter';

export interface MiniGameResult {
  passed:   boolean;
  stars:    1 | 2 | 3;
  attempts: number;
}

// Play area bounds (below header + progress strip, above bottom margin)
export const PLAY_TOP = 88;
export const PLAY_BOT = 780;
export const PLAY_H   = PLAY_BOT - PLAY_TOP;   // 692
export const PLAY_CX  = 240;                   // GAME_WIDTH / 2

export abstract class BaseMiniGame {
  protected scene:     Phaser.Scene;
  protected cfg:       LevelConfig;
  protected guide:     GuideCharacter;
  protected container: Phaser.GameObjects.Container;
  protected attempts   = 0;

  constructor(scene: Phaser.Scene, cfg: LevelConfig, guide: GuideCharacter) {
    this.scene     = scene;
    this.cfg       = cfg;
    this.guide     = guide;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(2);
  }

  abstract build(): void;

  showHint(): void {
    this.guide.pointUp();
    this.guide.say('👉 Hãy thử lại nha!', 2000);
  }

  destroy(): void {
    this.scene.tweens.killTweensOf(this.container);
    this.container.destroy(true);
  }

  protected calcStars(): 1 | 2 | 3 {
    if (this.attempts === 0) return 3;
    if (this.attempts <= 1) return 2;
    return 1;
  }

  protected finish(passed: boolean): void {
    const result: MiniGameResult = { passed, stars: this.calcStars(), attempts: this.attempts };
    this.scene.events.emit('minigame-complete', result);
  }

  // Helper: rounded-rect button
  protected makeButton(
    parent: Phaser.GameObjects.Container,
    x: number, y: number, w: number, h: number,
    label: string, fontSize: string, bgColor: number,
    onClick: () => void,
  ): { bg: Phaser.GameObjects.Graphics; txt: Phaser.GameObjects.Text } {
    const bg  = this.scene.add.graphics();
    bg.fillStyle(bgColor);
    bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14);
    bg.lineStyle(3, 0xffffff, 0.3);
    bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 14);
    bg.setInteractive(
      new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h),
      Phaser.Geom.Rectangle.Contains,
    );
    bg.on('pointerover',  () => bg.setAlpha(0.85));
    bg.on('pointerout',   () => bg.setAlpha(1));
    bg.on('pointerdown',  onClick);

    const txt = this.scene.add.text(x, y, label, {
      fontSize, fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);

    parent.add([bg, txt]);
    return { bg, txt };
  }

  // Helper: pop-in tween for an object
  protected popIn(obj: Phaser.GameObjects.GameObject, delay = 0): void {
    (obj as Phaser.GameObjects.Container | Phaser.GameObjects.Text).setScale(0).setAlpha(0);
    this.scene.tweens.add({
      targets: obj, scaleX: 1, scaleY: 1, alpha: 1,
      ease: 'Back.easeOut', duration: 250, delay,
    });
  }

  // Helper: wrong-answer shake
  protected shake(obj: Phaser.GameObjects.GameObject, origX: number): void {
    this.scene.tweens.add({
      targets: obj,
      x: { from: origX - 10, to: origX + 10 },
      ease: 'Sine.inOut', duration: 60, repeat: 4, yoyo: true,
      onComplete: () => { (obj as Phaser.GameObjects.Container).x = origX; },
    });
  }

  // Helper: correct-answer flash (green)
  protected flashCorrect(obj: Phaser.GameObjects.Graphics, w: number, h: number, x: number, y: number): void {
    obj.clear();
    obj.fillStyle(0x27ae60);
    obj.fillRoundedRect(x, y, w, h, 14);
    this.scene.tweens.add({
      targets: obj, alpha: 0.5,
      ease: 'Sine.easeOut', duration: 300, yoyo: true,
      onComplete: () => obj.setAlpha(1),
    });
  }
}
