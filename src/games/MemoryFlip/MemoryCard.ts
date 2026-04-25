import * as Phaser from 'phaser';

export interface CardData {
  id: string;
  emoji: string;
  color: number; // front face background colour
}

export class MemoryCard {
  readonly scene: Phaser.Scene;
  readonly data: CardData;

  isFlipped  = false;
  isMatched  = false;

  private container: Phaser.GameObjects.Container;
  private backGroup!:  Phaser.GameObjects.Container;
  private frontGroup!: Phaser.GameObjects.Container;
  private flipping = false;

  readonly w: number;
  readonly h: number;

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number, data: CardData) {
    this.scene = scene;
    this.data  = data;
    this.w = w;
    this.h = h;

    this.container = scene.add.container(x, y);
    this.buildBack(w, h);
    this.buildFront(w, h);
    this.frontGroup.setVisible(false);
  }

  // ─── Back face ─────────────────────────────────────────────────────────────
  private buildBack(w: number, h: number) {
    this.backGroup = this.scene.add.container(0, 0);

    const r = 10;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a3a6e);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    bg.lineStyle(2, 0x3a6abf, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, r);

    // Small dots pattern
    const dots = this.scene.add.graphics();
    dots.fillStyle(0x2a4a8e, 1);
    const step = 14;
    for (let dy = -h / 2 + 10; dy < h / 2 - 6; dy += step) {
      for (let dx = -w / 2 + 10; dx < w / 2 - 6; dx += step) {
        dots.fillCircle(dx, dy, 2);
      }
    }

    // Question mark
    const qmark = this.scene.add.text(0, 0, '?', {
      fontSize: `${Math.round(w * 0.45)}px`,
      color: '#4a7abf',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.backGroup.add([bg, dots, qmark]);
    this.container.add(this.backGroup);
  }

  // ─── Front face ────────────────────────────────────────────────────────────
  private buildFront(w: number, h: number) {
    this.frontGroup = this.scene.add.container(0, 0);

    const r = 10;
    const bg = this.scene.add.graphics();
    bg.fillStyle(this.data.color);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    bg.lineStyle(2, 0xffffff, 0.25);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, r);

    const emojiSize = Math.round(w * 0.52);
    const emoji = this.scene.add.text(0, -6, this.data.emoji, {
      fontSize: `${emojiSize}px`,
    }).setOrigin(0.5);

    this.frontGroup.add([bg, emoji]);
    this.container.add(this.frontGroup);
  }

  // ─── Enable / disable pointer ───────────────────────────────────────────────
  enable() {
    this.backGroup.getAll().forEach(obj => {
      if (obj instanceof Phaser.GameObjects.Graphics || obj instanceof Phaser.GameObjects.Text) return;
    });
    // Use the container itself as the hit area
    const hitZone = this.scene.add.rectangle(0, 0, this.w, this.h, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', () => this.onTap());
    hitZone.on('pointerover', () => { if (!this.isFlipped && !this.isMatched) this.container.setAlpha(0.85); });
    hitZone.on('pointerout',  () => this.container.setAlpha(1));
    this.container.add(hitZone);
  }

  private onTap() {
    if (this.isFlipped || this.isMatched || this.flipping) return;
    this.scene.events.emit('card-tapped', this);
  }

  // ─── Flip animations ────────────────────────────────────────────────────────
  flipUp(onDone?: () => void) {
    if (this.isFlipped || this.flipping) return;
    this.flipping = true;
    this.scene.tweens.add({
      targets:  this.container,
      scaleX:   0,
      duration: 130,
      ease:     'Linear',
      onComplete: () => {
        this.backGroup.setVisible(false);
        this.frontGroup.setVisible(true);
        this.isFlipped = true;
        this.scene.tweens.add({
          targets:  this.container,
          scaleX:   1,
          duration: 130,
          ease:     'Linear',
          onComplete: () => { this.flipping = false; onDone?.(); },
        });
      },
    });
  }

  flipDown(onDone?: () => void) {
    if (!this.isFlipped || this.flipping) return;
    this.flipping = true;
    this.scene.tweens.add({
      targets:  this.container,
      scaleX:   0,
      duration: 130,
      ease:     'Linear',
      onComplete: () => {
        this.frontGroup.setVisible(false);
        this.backGroup.setVisible(true);
        this.isFlipped = false;
        this.scene.tweens.add({
          targets:  this.container,
          scaleX:   1,
          duration: 130,
          ease:     'Linear',
          onComplete: () => { this.flipping = false; onDone?.(); },
        });
      },
    });
  }

  /** Pop + glow when a pair is matched */
  celebrate() {
    this.isMatched = true;
    this.scene.tweens.add({
      targets:  this.container,
      scaleX:   1.15,
      scaleY:   1.15,
      duration: 120,
      yoyo:     true,
      ease:     'Back.easeOut',
      onComplete: () => {
        this.container.setAlpha(0.6); // dim matched cards slightly
      },
    });
  }

  /** Shake when a wrong pair is picked */
  shake(onDone?: () => void) {
    let count = 0;
    const shakeDir = () => {
      count++;
      const dx = count % 2 === 0 ? 6 : -6;
      this.scene.tweens.add({
        targets:  this.container,
        x:        this.container.x + dx,
        duration: 50,
        ease:     'Linear',
        onComplete: () => {
          if (count < 6) shakeDir();
          else {
            // restore x
            this.scene.tweens.add({ targets: this.container, x: this.container.x - (count % 2 === 0 ? 6 : -6) % 6, duration: 30 });
            onDone?.();
          }
        },
      });
    };
    shakeDir();
  }

  destroy() {
    this.container.destroy(true);
  }
}
