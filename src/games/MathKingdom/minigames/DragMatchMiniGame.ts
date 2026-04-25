import * as Phaser from 'phaser';
import { BaseMiniGame, PLAY_TOP, PLAY_CX } from './BaseMiniGame';
import { generateDragMatchGroups, DragGroup } from '../MathKingdomData';
import type { LevelConfig } from '../MathKingdomData';
import type { GuideCharacter } from '../GuideCharacter';

const W = 480;
const CARD_W = 72, CARD_H = 72;
const GROUP_W = 190, GROUP_H = 82;

interface NumberCard {
  container: Phaser.GameObjects.Container;
  bg:        Phaser.GameObjects.Graphics;
  value:     number;
  origX:     number;
  origY:     number;
  matched:   boolean;
}
interface DropTarget {
  zone:  Phaser.GameObjects.Zone;
  bg:    Phaser.GameObjects.Graphics;
  group: DragGroup;
  index: number;
}

export class DragMatchMiniGame extends BaseMiniGame {
  private groups!:  DragGroup[];
  private cards:    NumberCard[]  = [];
  private targets:  DropTarget[]  = [];
  private matched   = 0;

  constructor(s: Phaser.Scene, cfg: LevelConfig, g: GuideCharacter) { super(s, cfg, g); }

  build(): void {
    this.groups = generateDragMatchGroups(this.cfg);
    this.drawInstruction();
    this.createGroups();
    this.createCards();
    this.setupDrag();
    this.guide.idle();
    this.guide.say('Kéo số vào nhóm đúng! 🖐️', 2500);
  }

  private drawInstruction() {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0f2040, 0.8);
    bg.fillRoundedRect(20, PLAY_TOP + 6, W - 40, 38, 10);
    const t = this.scene.add.text(PLAY_CX, PLAY_TOP + 25, this.cfg.title, {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);
    this.container.add([bg, t]);
  }

  private createGroups() {
    const n   = this.groups.length;
    const gap = 12;
    const startY = PLAY_TOP + 60;
    const rowH   = GROUP_H + gap;
    // Groups on the right column
    const gx = W - 20 - GROUP_W / 2;

    this.groups.forEach((g, i) => {
      const gy = startY + i * rowH + GROUP_H / 2;

      // Background
      const bg = this.scene.add.graphics();
      bg.fillStyle(0x162040);
      bg.fillRoundedRect(gx - GROUP_W / 2, gy - GROUP_H / 2, GROUP_W, GROUP_H, 12);
      bg.lineStyle(2, 0x2a4a7a);
      bg.strokeRoundedRect(gx - GROUP_W / 2, gy - GROUP_H / 2, GROUP_W, GROUP_H, 12);

      // Objects inside group
      const spacing = Math.min(46, GROUP_W / g.count);
      const total   = (g.count - 1) * spacing;
      const ox      = gx - total / 2;
      for (let k = 0; k < g.count; k++) {
        const t = this.scene.add.text(ox + k * spacing, gy, g.emoji, { fontSize: '34px' }).setOrigin(0.5);
        this.container.add(t);
      }

      // Drop zone (invisible)
      const zone = this.scene.add.zone(gx, gy, GROUP_W, GROUP_H).setRectangleDropZone(GROUP_W, GROUP_H);

      this.container.add([bg]);
      this.targets.push({ zone, bg, group: g, index: i });
      this.popIn(bg, i * 100);
    });
  }

  private createCards() {
    const n   = this.groups.length;
    const gap = 12;
    const startY = PLAY_TOP + 60;
    const rowH   = GROUP_H + gap;
    const cx  = 20 + CARD_W / 2;

    // Shuffle card values (so they don't line up directly with groups)
    const vals = Phaser.Utils.Array.Shuffle(this.groups.map(g => g.count));

    vals.forEach((val, i) => {
      const cy = startY + i * rowH + GROUP_H / 2;
      const container = this.scene.add.container(cx, cy);

      const bg = this.scene.add.graphics();
      bg.fillStyle(0x8e44ad);
      bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 14);
      bg.lineStyle(3, 0xd4a0e8);
      bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 14);

      const txt = this.scene.add.text(0, 0, String(val), {
        fontSize: '40px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(0.5);

      container.add([bg, txt]);
      container.setSize(CARD_W, CARD_H);
      container.setInteractive({ draggable: true });
      this.scene.add.existing(container);

      this.container.add(container);
      const card: NumberCard = { container, bg, value: val, origX: cx, origY: cy, matched: false };
      this.cards.push(card);
      this.popIn(container, i * 120);
    });
  }

  private setupDrag() {
    this.scene.input.on('dragstart', (_: unknown, obj: Phaser.GameObjects.Container) => {
      obj.setDepth(20);
    });

    this.scene.input.on('drag', (_: unknown, obj: Phaser.GameObjects.Container, x: number, y: number) => {
      obj.setPosition(x, y);
    });

    this.scene.input.on('dragend', (_: unknown, obj: Phaser.GameObjects.Container, dropped: boolean) => {
      if (!dropped) this.snapBack(obj);
      obj.setDepth(2);
    });

    this.scene.input.on('drop', (_: unknown, obj: Phaser.GameObjects.Container, zone: Phaser.GameObjects.Zone) => {
      const card   = this.cards.find(c => c.container === obj);
      const target = this.targets.find(t => t.zone === zone);
      if (!card || !target || card.matched) return;

      if (card.value === target.group.count) {
        card.matched = true;
        card.container.disableInteractive();
        // Snap to zone
        this.scene.tweens.add({
          targets: card.container,
          x: zone.x, y: zone.y,
          ease: 'Back.easeOut', duration: 200,
        });
        // Flash zone green
        target.bg.clear();
        target.bg.fillStyle(0x27ae60, 0.6);
        target.bg.fillRoundedRect(
          zone.x - GROUP_W / 2, zone.y - GROUP_H / 2, GROUP_W, GROUP_H, 12,
        );
        this.guide.happy();
        this.matched++;
        if (this.matched === this.groups.length) {
          this.scene.time.delayedCall(600, () => this.finish(true));
        }
      } else {
        this.attempts++;
        this.snapBack(card.container);
        this.guide.thinking();
      }
    });
  }

  private snapBack(obj: Phaser.GameObjects.Container) {
    const card = this.cards.find(c => c.container === obj);
    if (!card) return;
    this.scene.tweens.add({
      targets: obj, x: card.origX, y: card.origY,
      ease: 'Back.easeOut', duration: 300,
    });
  }

  destroy(): void {
    this.scene.input.off('dragstart');
    this.scene.input.off('drag');
    this.scene.input.off('dragend');
    this.scene.input.off('drop');
    super.destroy();
  }

  showHint(): void {
    this.guide.pointRight();
    this.guide.say('Kéo thẻ số vào nhóm phù hợp! 👉', 2500);
    const unmatched = this.cards.find(c => !c.matched);
    if (unmatched) {
      this.scene.tweens.add({
        targets: unmatched.container, scaleX: 1.2, scaleY: 1.2,
        ease: 'Back.easeOut', duration: 250, yoyo: true, repeat: 1,
      });
    }
  }
}
