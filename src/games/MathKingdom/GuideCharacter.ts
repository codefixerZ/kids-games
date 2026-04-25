import * as Phaser from 'phaser';

// 🧙 Guide character — built entirely from Phaser shapes + emoji text.
// Drop an image named 'mk_guide' into public/assets/math-kingdom/ to replace
// the programmatic version automatically.

export class GuideCharacter {
  private scene:     Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private head!:     Phaser.GameObjects.Arc;
  private body!:     Phaser.GameObjects.Rectangle;
  private armL!:     Phaser.GameObjects.Rectangle;
  private armR!:     Phaser.GameObjects.Rectangle;
  private bubble!:   Phaser.GameObjects.Container;
  private bubbleTxt!:Phaser.GameObjects.Text;
  private bubbleTimer?: Phaser.Time.TimerEvent;
  private idleTween?: Phaser.Tweens.Tween;
  private useSprite  = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene     = scene;
    this.container = scene.add.container(x, y);
    this.container.setDepth(8);

    if (scene.textures.exists('mk_guide')) {
      this.buildFromSprite();
    } else {
      this.buildProgrammatic();
    }
    this.buildSpeechBubble();
    this.idle();
  }

  // ── Programmatic fallback ─────────────────────────────────────────────────
  private buildProgrammatic() {
    // Crown spikes
    const crown = this.scene.add.graphics();
    crown.fillStyle(0x8e44ad);
    for (let i = -1; i <= 1; i++) {
      crown.fillTriangle(i * 16, -54, i * 16 - 9, -40, i * 16 + 9, -40);
    }
    crown.fillStyle(0xf1c40f);
    crown.fillRect(-24, -42, 48, 10);

    // Body
    this.body = this.scene.add.rectangle(0, 10, 44, 50, 0xf39c12).setOrigin(0.5);

    // Arms
    this.armL = this.scene.add.rectangle(-28, 4, 14, 36, 0xf39c12)
      .setOrigin(0.5, 0).setAngle(10);
    this.armR = this.scene.add.rectangle(28, 4, 14, 36, 0xf39c12)
      .setOrigin(0.5, 0).setAngle(-10);

    // Feet
    const fl = this.scene.add.rectangle(-12, 36, 16, 12, 0xd35400).setOrigin(0.5, 0);
    const fr = this.scene.add.rectangle(12,  36, 16, 12, 0xd35400).setOrigin(0.5, 0);

    // Head
    this.head = this.scene.add.arc(0, -34, 28, 0, 360, false, 0xfad7a0);

    // Face
    const eyeL = this.scene.add.arc(-10, -38, 5, 0, 360, false, 0x1a1a2e);
    const eyeR = this.scene.add.arc( 10, -38, 5, 0, 360, false, 0x1a1a2e);
    const smile = this.scene.add.graphics();
    smile.lineStyle(2, 0x784212);
    smile.beginPath(); smile.arc(0, -28, 12, 0.2, Math.PI - 0.2); smile.strokePath();
    // Blush
    const bl = this.scene.add.arc(-17, -28, 7, 0, 360, false, 0xf1948a, 0.5);
    const br = this.scene.add.arc( 17, -28, 7, 0, 360, false, 0xf1948a, 0.5);

    this.container.add([crown, this.armL, this.armR, fl, fr, this.body,
                        this.head, bl, br, eyeL, eyeR, smile]);
  }

  private buildFromSprite() {
    this.useSprite = true;
    const img = this.scene.add.image(0, 0, 'mk_guide').setOrigin(0.5).setDisplaySize(80, 100);
    this.container.add(img);
    // Stub arm rects (off-screen, only used for pointer tweens)
    this.armL = this.scene.add.rectangle(-9999, 0, 1, 1, 0);
    this.armR = this.scene.add.rectangle(-9999, 0, 1, 1, 0);
    this.head = this.scene.add.arc(-9999, 0, 1);
    this.body = this.scene.add.rectangle(-9999, 0, 1, 1, 0);
  }

  // ── Speech bubble ─────────────────────────────────────────────────────────
  private buildSpeechBubble() {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0xffffff, 0.95);
    bg.lineStyle(2, 0x8e44ad);
    bg.fillRoundedRect(-80, -110, 160, 48, 10);
    bg.strokeRoundedRect(-80, -110, 160, 48, 10);
    // Tail
    bg.fillStyle(0xffffff, 0.95);
    bg.fillTriangle(-10, -62, 10, -62, 0, -50);

    this.bubbleTxt = this.scene.add.text(0, -86, '', {
      fontSize: '13px', color: '#1a1a2e', fontFamily: 'Arial',
      align: 'center', wordWrap: { width: 150 },
    }).setOrigin(0.5);

    this.bubble = this.scene.add.container(0, 0, [bg, this.bubbleTxt]);
    this.bubble.setAlpha(0);
    this.container.add(this.bubble);
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  idle(): void {
    this.stopTweens();
    this.idleTween = this.scene.tweens.add({
      targets: this.container, y: this.container.y - 6,
      ease: 'Sine.easeInOut', duration: 900, yoyo: true, repeat: -1,
    });
  }

  pointRight(): void {
    this.stopTweens();
    this.scene.tweens.add({
      targets: this.armR, angle: -60, duration: 250, ease: 'Back.easeOut',
    });
    this.scene.tweens.add({
      targets: this.armR, angle: -10, duration: 250, ease: 'Back.easeIn',
      delay: 600, onComplete: () => this.idle(),
    });
  }

  pointLeft(): void {
    this.stopTweens();
    this.scene.tweens.add({
      targets: this.armL, angle: 60, duration: 250, ease: 'Back.easeOut',
    });
    this.scene.tweens.add({
      targets: this.armL, angle: 10, duration: 250, ease: 'Back.easeIn',
      delay: 600, onComplete: () => this.idle(),
    });
  }

  pointUp(): void {
    this.stopTweens();
    this.scene.tweens.add({
      targets: this.armR, angle: -140, duration: 250, ease: 'Back.easeOut',
    });
    this.scene.tweens.add({
      targets: this.armR, angle: -10, duration: 250,
      delay: 800, onComplete: () => this.idle(),
    });
  }

  happy(): void {
    this.stopTweens();
    this.scene.tweens.add({
      targets: this.container, scaleX: 1.2, scaleY: 1.2,
      ease: 'Back.easeOut', duration: 180, yoyo: true, repeat: 2,
      onComplete: () => this.idle(),
    });
    this.spawnStars();
  }

  thinking(): void {
    this.stopTweens();
    this.scene.tweens.add({
      targets: this.head, angle: 20, ease: 'Sine.easeInOut',
      duration: 300, yoyo: true, repeat: 2,
      onComplete: () => { this.head.setAngle(0); this.idle(); },
    });
    this.say('🤔...', 1800);
  }

  say(text: string, ms = 2500): void {
    this.bubbleTxt.setText(text);
    this.bubble.setAlpha(1);
    this.bubbleTimer?.destroy();
    this.bubbleTimer = this.scene.time.delayedCall(ms, () => this.clearSpeech());
  }

  clearSpeech(): void {
    this.bubble.setAlpha(0);
    this.bubbleTimer?.destroy();
  }

  moveTo(x: number, y: number, duration = 400): void {
    this.scene.tweens.add({ targets: this.container, x, y, ease: 'Cubic.easeOut', duration });
  }

  getContainer(): Phaser.GameObjects.Container { return this.container; }

  destroy(): void {
    this.stopTweens();
    this.bubbleTimer?.destroy();
    this.container.destroy();
  }

  // ── Internals ─────────────────────────────────────────────────────────────
  private stopTweens() {
    this.scene.tweens.killTweensOf([this.container, this.head, this.armL, this.armR]);
    this.idleTween?.stop();
  }

  private spawnStars() {
    for (let i = 0; i < 5; i++) {
      const s = this.scene.add.text(
        this.container.x + Phaser.Math.Between(-30, 30),
        this.container.y - 30,
        '⭐', { fontSize: '16px' },
      );
      this.scene.tweens.add({
        targets: s,
        x: s.x + Phaser.Math.Between(-40, 40),
        y: s.y - Phaser.Math.Between(40, 80),
        alpha: 0, duration: 700, delay: i * 80,
        onComplete: () => s.destroy(),
      });
    }
  }
}
