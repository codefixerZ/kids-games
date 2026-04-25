import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS } from '../../config';
import { getLevelConfig, getWorldDefs, TOTAL_LEVELS } from './MathKingdomData';
import { MathKingdomState } from './MathKingdomState';

export class MathKingdomRewardScene extends Phaser.Scene {
  private levelId!: number;
  private stars!:   1 | 2 | 3;

  constructor() { super({ key: SCENE_KEYS.MATH_KINGDOM_REWARD }); }

  init(data: { levelId: number; stars: 1 | 2 | 3 }) {
    this.levelId = data.levelId;
    this.stars   = data.stars;
  }

  create() {
    const cfg   = getLevelConfig(this.levelId)!;
    const world = getWorldDefs().find(w => w.worldId === cfg.worldId)!;

    this.drawBackground(world.bgColor);
    this.spawnConfetti();
    this.drawStars();
    this.drawMessage();
    this.drawButtons();
  }

  private drawBackground(bgColor: number) {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, bgColor);
    const g = this.add.graphics().setAlpha(0.06);
    for (let i = 0; i < 30; i++) {
      g.fillStyle(0xffffff);
      g.fillCircle(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(0, GAME_HEIGHT), Phaser.Math.Between(1, 3));
    }
  }

  private spawnConfetti() {
    const colors = [0xe74c3c, 0xf1c40f, 0x27ae60, 0x3498db, 0x9b59b6, 0xe67e22];
    for (let i = 0; i < 20; i++) {
      const g = this.add.graphics();
      const col = colors[i % colors.length];
      g.fillStyle(col, 0.85);
      g.fillRect(0, 0, Phaser.Math.Between(8, 16), Phaser.Math.Between(8, 16));
      g.setPosition(Phaser.Math.Between(30, GAME_WIDTH - 30), -20);
      this.tweens.add({
        targets: g,
        y: GAME_HEIGHT + 20,
        x: `+=${Phaser.Math.Between(-60, 60)}`,
        angle: Phaser.Math.Between(-360, 360),
        duration: Phaser.Math.Between(1400, 2200),
        delay: i * 80,
        ease: 'Linear',
        onComplete: () => g.destroy(),
      });
    }
  }

  private drawStars() {
    const y = 260;
    for (let i = 0; i < 3; i++) {
      const filled = i < this.stars;
      const x      = GAME_WIDTH / 2 + (i - 1) * 90;
      const star   = this.add.text(x, y, filled ? '⭐' : '☆', {
        fontSize: '64px',
        color: filled ? '#f1c40f' : '#555577',
      }).setOrigin(0.5).setScale(0).setAlpha(filled ? 1 : 0.4);

      this.tweens.add({
        targets: star, scaleX: 1, scaleY: 1,
        ease: 'Back.easeOut', duration: 380,
        delay: 300 + i * 180,
      });
    }
  }

  private drawMessage() {
    const msgs: Record<1 | 2 | 3, string> = {
      3: '🎉 Xuất sắc! 🎉',
      2: '👍 Tốt lắm!',
      1: '😊 Cố lên nha!',
    };
    this.add.text(GAME_WIDTH / 2, 380, msgs[this.stars], {
      fontSize: '30px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setScale(0).setAlpha(0);

    this.tweens.add({
      targets: this.children.list[this.children.list.length - 1] as Phaser.GameObjects.Text,
      scaleX: 1, scaleY: 1, alpha: 1,
      ease: 'Back.easeOut', duration: 380, delay: 800,
    });

    this.add.text(GAME_WIDTH / 2, 440, `Cấp ${this.levelId} — ${this.stars} ⭐`, {
      fontSize: '17px', color: '#aaaacc', fontFamily: 'Arial',
    }).setOrigin(0.5);
  }

  private drawButtons() {
    const mkBtn = (label: string, y: number, col: number, fn: () => void) => {
      const bg = this.add.graphics();
      bg.fillStyle(col);
      bg.fillRoundedRect(GAME_WIDTH / 2 - 160, y - 26, 320, 52, 16);
      bg.setInteractive(
        new Phaser.Geom.Rectangle(GAME_WIDTH / 2 - 160, y - 26, 320, 52),
        Phaser.Geom.Rectangle.Contains,
      ).setAlpha(0);
      this.tweens.add({ targets: bg, alpha: 1, duration: 300, delay: 1100 });
      bg.on('pointerover', () => bg.setAlpha(0.85));
      bg.on('pointerout',  () => bg.setAlpha(1));
      bg.on('pointerdown', fn);

      const t = this.add.text(GAME_WIDTH / 2, y, label, {
        fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 300, delay: 1100 });
    };

    const hasNext = this.levelId < TOTAL_LEVELS &&
                    MathKingdomState.getInstance().isUnlocked(this.levelId + 1);

    if (hasNext) {
      mkBtn('▶ Cấp tiếp theo', 530, 0x27ae60, () => this.goToLevel(this.levelId + 1));
    }
    mkBtn('🔄 Chơi lại',    hasNext ? 596 : 530, 0x2980b9, () => this.goToLevel(this.levelId));
    mkBtn('🗺 Bản đồ',       hasNext ? 660 : 596, 0x2c3e50, () => this.goToMap());
  }

  private goToLevel(id: number) {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENE_KEYS.MATH_KINGDOM_GAME, { levelId: id });
    });
  }

  private goToMap() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENE_KEYS.MATH_KINGDOM_MAP);
    });
  }
}
