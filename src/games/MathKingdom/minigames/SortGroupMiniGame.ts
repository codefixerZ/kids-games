import * as Phaser from 'phaser';
import { BaseMiniGame, PLAY_TOP, PLAY_CX } from './BaseMiniGame';
import { generateSortGroupData } from '../MathKingdomData';
import type { LevelConfig, ColoredObject, ColorDef } from '../MathKingdomData';
import type { GuideCharacter } from '../GuideCharacter';

const W = 480;
const ITEM_R  = 28;
const BKT_W   = 180, BKT_H = 160;

interface DragItem {
  container: Phaser.GameObjects.Container;
  color:     ColorDef;
  origX:     number;
  origY:     number;
  sorted:    boolean;
}
interface Bucket {
  zone:      Phaser.GameObjects.Zone;
  bg:        Phaser.GameObjects.Graphics;
  color:     ColorDef;
  countText: Phaser.GameObjects.Text;
  count:     number;
  cx:        number;
  cy:        number;
}

export class SortGroupMiniGame extends BaseMiniGame {
  private data!:    ReturnType<typeof generateSortGroupData>;
  private items:    DragItem[] = [];
  private buckets:  Bucket[]   = [];
  private sorted    = 0;

  constructor(s: Phaser.Scene, cfg: LevelConfig, g: GuideCharacter) { super(s, cfg, g); }

  build(): void {
    this.data = generateSortGroupData(this.cfg);
    this.drawInstruction();
    this.createItems();
    this.createBuckets();
    this.setupDrag();
    this.guide.idle();
    this.guide.say('Kéo vào thùng cùng màu nhé! 🎨', 2500);
  }

  private drawInstruction() {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0f2040, 0.85);
    bg.fillRoundedRect(10, PLAY_TOP + 4, W - 20, 38, 10);
    const t = this.scene.add.text(PLAY_CX, PLAY_TOP + 23, this.cfg.title, {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);
    this.container.add([bg, t]);
  }

  private createItems() {
    const objs  = this.data.objects;
    const cols  = 5;
    const rows  = Math.ceil(objs.length / cols);
    const cellW = (W - 20) / cols;
    const cellH = 68;
    const startX = 10 + cellW / 2;
    const startY = PLAY_TOP + 56;

    objs.forEach((obj: ColoredObject, i: number) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x   = startX + col * cellW;
      const y   = startY + row * cellH;

      const container = this.scene.add.container(x, y);
      const bg = this.scene.add.arc(0, 0, ITEM_R, 0, 360, false,
        Phaser.Display.Color.HexStringToColor(obj.color.hex).color);
      const txt = this.scene.add.text(0, 0, obj.emoji, { fontSize: '28px' }).setOrigin(0.5);
      container.add([bg, txt]);
      container.setSize(ITEM_R * 2, ITEM_R * 2);
      container.setInteractive({ draggable: true });
      this.scene.add.existing(container);
      this.container.add(container);

      const item: DragItem = { container, color: obj.color, origX: x, origY: y, sorted: false };
      this.items.push(item);
      this.popIn(container, i * 40);
    });
  }

  private createBuckets() {
    const startY = PLAY_TOP + 54 + 3 * 68 + 20; // below items
    const gap    = 20;
    const n      = this.data.buckets.length;
    const totalW = n * BKT_W + (n - 1) * gap;
    const startX = PLAY_CX - totalW / 2 + BKT_W / 2;

    this.data.buckets.forEach((color: ColorDef, i: number) => {
      const cx = startX + i * (BKT_W + gap);
      const cy = startY + BKT_H / 2;

      // Bucket background
      const bg = this.scene.add.graphics();
      const col = Phaser.Display.Color.HexStringToColor(color.hex).color;
      bg.fillStyle(col, 0.25);
      bg.fillRoundedRect(cx - BKT_W / 2, cy - BKT_H / 2, BKT_W, BKT_H, 16);
      bg.lineStyle(3, col, 0.8);
      bg.strokeRoundedRect(cx - BKT_W / 2, cy - BKT_H / 2, BKT_W, BKT_H, 16);

      // Color label
      const label = this.scene.add.text(cx, cy - BKT_H / 2 + 18, `${color.emoji}`, {
        fontSize: '28px',
      }).setOrigin(0.5);

      // Count inside bucket
      const countText = this.scene.add.text(cx, cy + 16, '0', {
        fontSize: '44px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(0.5);

      // Drop zone
      const zone = this.scene.add.zone(cx, cy, BKT_W, BKT_H).setRectangleDropZone(BKT_W, BKT_H);

      this.container.add([bg, label, countText]);
      this.buckets.push({ zone, bg, color, countText, count: 0, cx, cy });
      this.popIn(bg, i * 100 + 200);
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
      const item   = this.items.find(it => it.container === obj);
      const bucket = this.buckets.find(b => b.zone === zone);
      if (!item || !bucket || item.sorted) return;

      if (item.color.hex === bucket.color.hex) {
        item.sorted = true;
        item.container.disableInteractive();
        // Snap inside bucket
        this.scene.tweens.add({
          targets: item.container,
          x: bucket.cx + Phaser.Math.Between(-50, 50),
          y: bucket.cy + Phaser.Math.Between(-20, 20),
          scaleX: 0.7, scaleY: 0.7,
          ease: 'Back.easeOut', duration: 220,
        });
        bucket.count++;
        bucket.countText.setText(String(bucket.count));
        this.scene.tweens.add({ targets: bucket.countText, scaleX: 1.3, scaleY: 1.3, ease: 'Back.easeOut', duration: 180, yoyo: true });
        this.sorted++;
        if (this.sorted === this.items.length) {
          this.guide.happy();
          this.scene.time.delayedCall(800, () => this.finish(true));
        }
      } else {
        this.attempts++;
        this.guide.thinking();
        this.snapBack(obj);
      }
    });
  }

  private snapBack(obj: Phaser.GameObjects.Container) {
    const item = this.items.find(it => it.container === obj);
    if (!item) return;
    this.scene.tweens.add({
      targets: obj, x: item.origX, y: item.origY, scaleX: 1, scaleY: 1,
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
    this.guide.say('Kéo vào thùng cùng màu nhé! 🌈', 2500);
    const unfinished = this.items.find(it => !it.sorted);
    if (unfinished) {
      this.scene.tweens.add({
        targets: unfinished.container, scaleX: 1.3, scaleY: 1.3,
        ease: 'Back.easeOut', duration: 250, yoyo: true, repeat: 1,
      });
    }
  }
}
