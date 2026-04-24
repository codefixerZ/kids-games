import * as Phaser from 'phaser';

export class CharacterSprite {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  // Owl body parts
  private leftEyePupil!: Phaser.GameObjects.Arc;
  private rightEyePupil!: Phaser.GameObjects.Arc;
  private beak!: Phaser.GameObjects.Triangle;

  // Speech bubble
  private bubbleBg!: Phaser.GameObjects.Graphics;
  private bubbleText!: Phaser.GameObjects.Text;

  private idleTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, bubbleWidth: number) {
    this.scene = scene;
    this.container = scene.add.container(x, y);
    this.drawOwl();
    this.drawSpeechBubble(bubbleWidth);
    this.startIdle();
  }

  private drawOwl() {
    const s = this.scene;

    // Shadow
    this.container.add(s.add.ellipse(2, 62, 64, 18, 0x000000, 0.18));

    // Body
    const body = s.add.ellipse(0, 30, 70, 80, 0xd4a843);
    body.setStrokeStyle(2, 0xb8882a);
    this.container.add(body);

    // Belly
    this.container.add(s.add.ellipse(0, 38, 44, 52, 0xf5d98b));

    // Left wing
    const lWing = s.add.ellipse(-38, 28, 22, 52, 0xb8882a);
    lWing.setAngle(-12);
    this.container.add(lWing);

    // Right wing
    const rWing = s.add.ellipse(38, 28, 22, 52, 0xb8882a);
    rWing.setAngle(12);
    this.container.add(rWing);

    // Head
    const head = s.add.circle(0, -18, 30, 0xd4a843);
    head.setStrokeStyle(2, 0xb8882a);
    this.container.add(head);

    // Ear tufts
    this.container.add(s.add.triangle(-16, -44, 0, 0, 10, 0, 5, 16, 0xb8882a));
    this.container.add(s.add.triangle(16, -44, -5, 0, 5, 0, 0, 16, 0xb8882a));

    // Left eye white
    this.container.add(s.add.circle(-11, -20, 12, 0xffffff));
    // Right eye white
    this.container.add(s.add.circle(11, -20, 12, 0xffffff));

    // Left iris
    this.container.add(s.add.circle(-11, -20, 8, 0x2c3e50));
    // Right iris
    this.container.add(s.add.circle(11, -20, 8, 0x2c3e50));

    // Pupils (animated)
    this.leftEyePupil = s.add.circle(-11, -20, 4, 0x000000);
    this.rightEyePupil = s.add.circle(11, -20, 4, 0x000000);
    this.container.add([this.leftEyePupil, this.rightEyePupil]);

    // Eye shine
    this.container.add(s.add.circle(-8, -23, 2, 0xffffff));
    this.container.add(s.add.circle(14, -23, 2, 0xffffff));

    // Beak
    this.beak = s.add.triangle(0, -8, -7, 0, 7, 0, 0, 10, 0xe67e22);
    this.container.add(this.beak);

    // Feet
    this.container.add(s.add.rectangle(-14, 70, 8, 12, 0xe67e22).setOrigin(0.5, 0));
    this.container.add(s.add.rectangle(14, 70, 8, 12, 0xe67e22).setOrigin(0.5, 0));
    this.container.add(s.add.rectangle(-18, 81, 4, 8, 0xe67e22).setOrigin(0.5, 0));
    this.container.add(s.add.rectangle(-10, 81, 4, 8, 0xe67e22).setOrigin(0.5, 0));
    this.container.add(s.add.rectangle(10, 81, 4, 8, 0xe67e22).setOrigin(0.5, 0));
    this.container.add(s.add.rectangle(18, 81, 4, 8, 0xe67e22).setOrigin(0.5, 0));
  }

  private drawSpeechBubble(bubbleW: number) {
    const bx = 52;   // offset right of owl center
    const by = -80;
    const bh = 90;
    const r  = 14;

    this.bubbleBg = this.scene.add.graphics();
    this.drawBubbleShape(bx, by, bubbleW, bh, r);
    this.container.add(this.bubbleBg as Phaser.GameObjects.GameObject);

    this.bubbleText = this.scene.add.text(bx + 16, by + 14, '', {
      fontSize: '14px',
      color: '#1a1a2e',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      wordWrap: { width: bubbleW - 32 },
      lineSpacing: 4,
    });
    this.container.add(this.bubbleText);
  }

  private drawBubbleShape(bx: number, by: number, w: number, h: number, r: number) {
    const g = this.bubbleBg;
    g.clear();
    g.lineStyle(2, 0xbbbbdd, 1);
    g.fillStyle(0xffffff, 0.96);
    g.strokeRoundedRect(bx, by, w, h, r);
    g.fillRoundedRect(bx, by, w, h, r);
    // Tail pointing down-left toward owl head
    g.fillTriangle(bx + 20, by + h - 1, bx + 2, by + h + 14, bx + 38, by + h - 1);
  }

  setText(text: string) {
    this.bubbleText.setText(text);
  }

  private startIdle() {
    this.idleTween = this.scene.tweens.add({
      targets: this.container,
      y: this.container.y - 6,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  happy() {
    this.idleTween?.pause();
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.15, scaleY: 1.15,
      duration: 150,
      yoyo: true,
      repeat: 2,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.container.setScale(1);
        this.idleTween?.resume();
      },
    });
    // Pupils grow briefly (happy eyes)
    this.scene.tweens.add({ targets: [this.leftEyePupil, this.rightEyePupil], scaleX: 1.5, scaleY: 1.5, duration: 200, yoyo: true });
  }

  sad() {
    this.idleTween?.pause();
    this.scene.tweens.add({
      targets: this.container,
      x: this.container.x - 8,
      duration: 60,
      yoyo: true,
      repeat: 5,
      ease: 'Linear',
      onComplete: () => { this.idleTween?.resume(); },
    });
  }

  thinking() {
    // Pupils spin via rotation tween on container
    this.scene.tweens.add({
      targets: [this.leftEyePupil, this.rightEyePupil],
      scaleX: 0.5, scaleY: 0.5,
      duration: 300,
      yoyo: true,
      repeat: 3,
    });
  }

  destroy() {
    this.idleTween?.stop();
    this.container.destroy(true);
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }
}
