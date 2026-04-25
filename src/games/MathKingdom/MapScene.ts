import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS } from '../../config';
import { getWorldDefs, getLevelConfig, getAllLevels, WorldDef, LevelConfig } from './MathKingdomData';
import { MathKingdomState } from './MathKingdomState';

// ── Node layout (zigzag, bottom→top) ────────────────────────────────────────
const NODES: { levelId: number; x: number; y: number }[] = [
  { levelId: 1, x: 240, y: 720 },
  { levelId: 2, x: 340, y: 620 },
  { levelId: 3, x: 140, y: 520 },
  { levelId: 4, x: 340, y: 410 },
  { levelId: 5, x: 140, y: 310 },
  { levelId: 6, x: 240, y: 200 },
];
const NODE_R = 36;

export class MathKingdomMapScene extends Phaser.Scene {
  private state!: MathKingdomState;
  private worlds!: WorldDef[];

  constructor() { super({ key: SCENE_KEYS.MATH_KINGDOM_MAP }); }

  preload() {
    // 📦 Asset slots — place files in public/assets/math-kingdom/ to use them
    // this.load.image('mk_map_bg', 'assets/math-kingdom/map_bg.png');
    // this.load.image('mk_castle', 'assets/math-kingdom/castle.png');
    // this.load.image('mk_tree',   'assets/math-kingdom/tree.png');
  }

  create() {
    this.state  = MathKingdomState.getInstance();
    this.worlds = getWorldDefs();
    this.drawBackground();
    this.drawWorldBands();
    this.drawPath();
    this.drawNodes();
    this.drawHeader();
    this.drawResetBtn();
  }

  // ── Background ─────────────────────────────────────────────────────────────
  private drawBackground() {
    // Sky gradient (drawn top to bottom in 3 bands matching worlds)
    const g = this.add.graphics();
    // World 3 zone (top) - dark mystical
    g.fillStyle(0x1a0a2a);
    g.fillRect(0, 0, GAME_WIDTH, 280);
    // World 2 zone (mid)
    g.fillStyle(0x0d1a3a);
    g.fillRect(0, 280, GAME_WIDTH, 260);
    // World 1 zone (bottom) - forest
    g.fillStyle(0x0d2a0d);
    g.fillRect(0, 540, GAME_WIDTH, GAME_HEIGHT - 540);

    // Stars in top zone
    g.fillStyle(0xffffff, 0.5);
    for (let i = 0; i < 30; i++) {
      g.fillCircle(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, 260),
        Phaser.Math.Between(1, 2),
      );
    }
    // Ground strip at bottom
    g.fillStyle(0x1a5a0d);
    g.fillRect(0, GAME_HEIGHT - 40, GAME_WIDTH, 40);
    // Trees (programmatic)
    this.drawTrees();
  }

  private drawTrees() {
    const g = this.add.graphics();
    g.fillStyle(0x145a0d);
    const positions = [20, 60, 380, 420, 460, 100, 320];
    positions.forEach(x => {
      const y = GAME_HEIGHT - 40;
      g.fillTriangle(x, y - 50, x - 20, y, x + 20, y);
      g.fillTriangle(x, y - 80, x - 16, y - 35, x + 16, y - 35);
      g.fillStyle(0x6b3a0d);
      g.fillRect(x - 5, y - 10, 10, 12);
      g.fillStyle(0x145a0d);
    });
  }

  private drawWorldBands() {
    // World name labels
    const labels = [
      { name: '🏰 Khu Giải Cứu',  y: 60,  color: '#f39c12' },
      { name: '🌈 Vùng Màu Sắc',   y: 360, color: '#9b59b6' },
      { name: '🌲 Rừng Đếm Số',    y: 560, color: '#27ae60' },
    ];
    labels.forEach(({ name, y, color }) => {
      this.add.text(GAME_WIDTH / 2, y, name, {
        fontSize: '16px', color, fontFamily: 'Arial', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5);
    });

    // Dividing lines between worlds
    const gLine = this.add.graphics();
    gLine.lineStyle(1, 0xffffff, 0.15);
    gLine.lineBetween(20, 280, GAME_WIDTH - 20, 280);
    gLine.lineBetween(20, 540, GAME_WIDTH - 20, 540);
  }

  // ── Dotted path connecting nodes ─────────────────────────────────────────
  private drawPath() {
    const g = this.add.graphics();
    for (let i = 0; i < NODES.length - 1; i++) {
      const a = NODES[i], b = NODES[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.floor(dist / 18);
      for (let s = 0; s <= steps; s++) {
        const t  = s / steps;
        const px = a.x + dx * t;
        const py = a.y + dy * t;
        g.fillStyle(0xf1c40f, 0.6);
        g.fillCircle(px, py, 4);
      }
    }
  }

  // ── Level nodes ───────────────────────────────────────────────────────────
  private drawNodes() {
    const allLevels = getAllLevels();
    NODES.forEach(({ levelId, x, y }) => {
      const cfg      = getLevelConfig(levelId)!;
      const world    = this.worlds.find(w => w.worldId === cfg.worldId)!;
      const unlocked = this.state.isUnlocked(levelId);
      const stars    = this.state.getStars(levelId);
      const current  = this.state.getCurrentLevel() === levelId;

      // Node shadow
      const shadow = this.add.arc(x + 4, y + 4, NODE_R, 0, 360, false, 0x000000, 0.3);

      // Node circle
      const nodeColor = unlocked ? world.nodeColor : 0x555555;
      const node      = this.add.arc(x, y, NODE_R, 0, 360, false, nodeColor);
      node.setStrokeStyle(3, unlocked ? 0xffffff : 0x888888, 0.6);

      // Current pulse
      if (current && unlocked) {
        this.tweens.add({
          targets: node, scaleX: 1.15, scaleY: 1.15,
          ease: 'Sine.easeInOut', duration: 700, yoyo: true, repeat: -1,
        });
        const glow = this.add.arc(x, y, NODE_R + 10, 0, 360, false, world.nodeColor, 0.3);
        this.tweens.add({ targets: glow, alpha: 0, ease: 'Sine.easeInOut', duration: 700, yoyo: true, repeat: -1 });
      }

      // Level number or lock
      if (unlocked) {
        this.add.text(x, y - 6, String(levelId), {
          fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
        }).setOrigin(0.5);
      } else {
        this.add.text(x, y, '🔒', { fontSize: '20px' }).setOrigin(0.5);
      }

      // Stars below node
      if (stars > 0) {
        const starStr = '⭐'.repeat(stars);
        this.add.text(x, y + NODE_R + 10, starStr, { fontSize: '11px' }).setOrigin(0.5);
      }

      // Tap to play (unlocked only)
      if (unlocked) {
        node.setInteractive({ useHandCursor: true });
        node.on('pointerdown', () => this.goToLevel(levelId));
        node.on('pointerover', () => node.setAlpha(0.85));
        node.on('pointerout',  () => node.setAlpha(1));
      }
    });
  }

  // ── Header ─────────────────────────────────────────────────────────────────
  private drawHeader() {
    this.add.rectangle(GAME_WIDTH / 2, 22, GAME_WIDTH, 44, 0x0a1628, 0.92).setDepth(10);
    const back = this.add.text(14, 10, '⬅ Home', {
      fontSize: '14px', color: '#aaaacc', fontFamily: 'Arial',
    }).setDepth(10).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#ffffff'));
    back.on('pointerout',  () => back.setColor('#aaaacc'));
    back.on('pointerdown', () => this.goToMenu());

    this.add.text(GAME_WIDTH / 2, 10, '🏰 Magic Counting Kingdom', {
      fontSize: '15px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(10);
  }

  private drawResetBtn() {
    const y = GAME_HEIGHT - 20;
    const btn = this.add.text(GAME_WIDTH - 14, y, '🔄 Reset', {
      fontSize: '12px', color: '#555577', fontFamily: 'Arial',
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => {
      MathKingdomState.getInstance().reset();
      this.scene.restart();
    });
  }

  private goToLevel(levelId: number) {
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENE_KEYS.MATH_KINGDOM_GAME, { levelId });
    });
  }

  private goToMenu() {
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENE_KEYS.MENU);
    });
  }
}
