import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS } from '../../config';

// ── Layout ────────────────────────────────────────────────────────────────────
const HEADER_H  = 45;
const Q_H       = 75;               // question strip height
const GRID_TOP  = HEADER_H + Q_H + 20;
const CELL_SIZE = 200;              // each card is 200×200
const GRID_GAP  = 10;
const ROUNDS    = 12;

// ── Question data ──────────────────────────────────────────────────────────────
// Format: [item repeated ×3, oddItem, hint text]
const RAW: [string, string, string, string, string][] = [
  ['🐱','🐱','🐱','🐶', 'Tìm con khác loài!'],
  ['🍎','🍎','🍎','🍕', 'Tìm thứ không phải trái cây!'],
  ['🚗','🚗','🚗','✈️', 'Tìm thứ không chạy trên đường!'],
  ['🐠','🐠','🐠','🐦', 'Tìm con không sống dưới nước!'],
  ['🌺','🌺','🌺','🌵', 'Tìm cây không có hoa!'],
  ['⭐','⭐','⭐','❤️', 'Tìm hình không phải ngôi sao!'],
  ['🏠','🏠','🏠','🚢', 'Tìm thứ không phải nhà!'],
  ['🎈','🎈','🎈','🎯', 'Tìm thứ không phải bóng bay!'],
  ['🐰','🐰','🐰','🐘', 'Tìm con to nhất!'],
  ['🌙','🌙','🌙','☀️', 'Tìm thứ xuất hiện ban ngày!'],
  ['🍓','🍓','🍓','🥕', 'Tìm thứ không phải quả!'],
  ['🚂','🚂','🚂','🚢', 'Tìm thứ không đi trên đường ray!'],
  ['🐶','🐶','🐶','🐟', 'Tìm con sống dưới nước!'],
  ['🍌','🍌','🍌','🍔', 'Tìm thứ không phải trái cây!'],
  ['🎸','🎸','🎸','🥁', 'Tìm nhạc cụ không có dây!'],
  ['🌧️','🌧️','🌧️','🌈', 'Tìm thứ xuất hiện sau mưa!'],
  ['🐸','🐸','🐸','🦁', 'Tìm con sống ở rừng!'],
  ['🍦','🍦','🍦','🍕', 'Tìm thứ không phải kem!'],
  ['🚌','🚌','🚌','🚁', 'Tìm thứ bay trên trời!'],
  ['⚽','⚽','⚽','🏓', 'Tìm dụng cụ không phải bóng!'],
];

interface CardData { emoji: string; isOdd: boolean; }

export class OddOneOutScene extends Phaser.Scene {
  private score       = 0;
  private round       = 0;
  private busy        = false;
  private usedIdxs    = new Set<number>();

  private scoreText!:  Phaser.GameObjects.Text;
  private hintText!:   Phaser.GameObjects.Text;
  private roundText!:  Phaser.GameObjects.Text;
  private cards:       Phaser.GameObjects.Container[] = [];

  constructor() { super({ key: SCENE_KEYS.ODD_ONE_OUT }); }

  create() {
    this.score    = 0;
    this.round    = 0;
    this.busy     = false;
    this.usedIdxs = new Set();

    this.drawBackground();
    this.drawHeader();
    this.drawQuestionStrip();
    this.nextRound();
  }

  // ── Background ─────────────────────────────────────────────────────────────
  private drawBackground() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0d1f35);
    const g = this.add.graphics().setAlpha(0.04);
    for (let i = 0; i < 30; i++) {
      g.fillStyle(0xffffff);
      g.fillCircle(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(0, GAME_HEIGHT), Phaser.Math.Between(1, 3));
    }
  }

  // ── Header ──────────────────────────────────────────────────────────────────
  private drawHeader() {
    this.add.rectangle(GAME_WIDTH / 2, HEADER_H / 2, GAME_WIDTH, HEADER_H, 0x0a1628).setDepth(10);

    const back = this.add.text(14, 13, '⬅ Home', {
      fontSize: '14px', color: '#aaaacc', fontFamily: 'Arial',
    }).setDepth(10).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#ffffff'));
    back.on('pointerout',  () => back.setColor('#aaaacc'));
    back.on('pointerdown', () => this.goToMenu());

    this.add.text(GAME_WIDTH / 2, 13, '📖 Tìm Hình Khác Biệt', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(10);

    this.scoreText = this.add.text(GAME_WIDTH - 14, 13, '⭐ 0', {
      fontSize: '16px', color: '#f1c40f', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(1, 0).setDepth(10);
  }

  // ── Question strip ──────────────────────────────────────────────────────────
  private drawQuestionStrip() {
    this.add.rectangle(GAME_WIDTH / 2, HEADER_H + Q_H / 2, GAME_WIDTH, Q_H, 0x0f2040);

    this.hintText = this.add.text(GAME_WIDTH / 2, HEADER_H + 14, '', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.roundText = this.add.text(GAME_WIDTH / 2, HEADER_H + 46, '', {
      fontSize: '13px', color: '#8899bb', fontFamily: 'Arial',
    }).setOrigin(0.5, 0);
  }

  // ── Build 4-card grid ───────────────────────────────────────────────────────
  private buildCards(cardData: CardData[]) {
    this.cards.forEach(c => c.destroy());
    this.cards = [];

    const totalW = 2 * CELL_SIZE + GRID_GAP;
    const totalH = 2 * CELL_SIZE + GRID_GAP;
    const startX = (GAME_WIDTH - totalW) / 2;
    const startY = GRID_TOP;

    cardData.forEach((cd, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx  = startX + col * (CELL_SIZE + GRID_GAP) + CELL_SIZE / 2;
      const cy  = startY + row * (CELL_SIZE + GRID_GAP) + CELL_SIZE / 2;

      const bg = this.add.rectangle(0, 0, CELL_SIZE - 4, CELL_SIZE - 4, 0x162040)
        .setStrokeStyle(2, 0x3a5a8a);

      const emoji = this.add.text(0, 0, cd.emoji, {
        fontSize: '80px',
      }).setOrigin(0.5);

      const c = this.add.container(cx, cy, [bg, emoji]);
      bg.setInteractive({ useHandCursor: true });

      // Entrance pop
      c.setScale(0.6).setAlpha(0);
      this.tweens.add({ targets: c, scaleX: 1, scaleY: 1, alpha: 1, ease: 'Back.easeOut', duration: 300, delay: i * 80 });

      bg.on('pointerover',  () => { if (!this.busy) bg.setFillStyle(0x1e3060); });
      bg.on('pointerout',   () => { if (!this.busy) bg.setFillStyle(0x162040); });
      bg.on('pointerdown',  () => this.handlePick(c, bg, cd.isOdd));

      this.cards.push(c);
    });
  }

  // ── Answer handler ──────────────────────────────────────────────────────────
  private handlePick(card: Phaser.GameObjects.Container, bg: Phaser.GameObjects.Rectangle, isOdd: boolean) {
    if (this.busy) return;
    this.busy = true;
    this.cards.forEach(c => (c.getAt(0) as Phaser.GameObjects.Rectangle).disableInteractive());

    if (isOdd) {
      this.score += 10;
      this.scoreText.setText(`⭐ ${this.score}`);
      bg.setFillStyle(0x27ae60).setStrokeStyle(3, 0x2ecc71);

      // Victory bounce
      this.tweens.add({ targets: card, y: card.y - 18, ease: 'Cubic.easeOut', duration: 180, yoyo: true, repeat: 1 });

      this.time.delayedCall(900, () => this.nextRound());
    } else {
      bg.setFillStyle(0xc0392b).setStrokeStyle(3, 0xe74c3c);

      // Shake
      this.tweens.add({ targets: card, x: { from: card.x - 10, to: card.x + 10 }, ease: 'Sine.inOut', duration: 70, repeat: 4, yoyo: true,
        onComplete: () => { card.x = this.cards.indexOf(card) % 2 === 0
          ? (GAME_WIDTH - 2 * CELL_SIZE - GRID_GAP) / 2 + CELL_SIZE / 2
          : (GAME_WIDTH - 2 * CELL_SIZE - GRID_GAP) / 2 + CELL_SIZE + GRID_GAP + CELL_SIZE / 2;
          bg.setFillStyle(0x162040).setStrokeStyle(2, 0x3a5a8a);
        }
      });

      // Highlight the correct card
      this.time.delayedCall(400, () => {
        this.cards.forEach(c => {
          const data = c.getData('isOdd');
          if (data) {
            const b = c.getAt(0) as Phaser.GameObjects.Rectangle;
            b.setStrokeStyle(3, 0x2ecc71);
            this.tweens.add({ targets: c, scaleX: 1.08, scaleY: 1.08, ease: 'Cubic.easeOut', duration: 200, yoyo: true });
          }
        });
        this.time.delayedCall(900, () => this.nextRound());
      });
    }
  }

  // ── Next round ──────────────────────────────────────────────────────────────
  private nextRound() {
    this.round++;
    if (this.round > ROUNDS) { this.showEnd(); return; }

    this.busy = false;

    // Pick an unused question
    let idx: number;
    do { idx = Phaser.Math.Between(0, RAW.length - 1); }
    while (this.usedIdxs.has(idx) && this.usedIdxs.size < RAW.length);
    this.usedIdxs.add(idx);
    if (this.usedIdxs.size >= RAW.length) this.usedIdxs.clear();

    const [s1, s2, s3, odd, hint] = RAW[idx];
    this.hintText.setText(hint);
    this.roundText.setText(`Câu ${this.round} / ${ROUNDS}`);

    // Shuffle items
    const items: CardData[] = [
      { emoji: s1, isOdd: false },
      { emoji: s2, isOdd: false },
      { emoji: s3, isOdd: false },
      { emoji: odd, isOdd: true  },
    ];
    Phaser.Utils.Array.Shuffle(items);

    this.buildCards(items);

    // Store isOdd flag on each container for highlighting
    this.cards.forEach((c, i) => c.setData('isOdd', items[i].isOdd));
  }

  // ── End screen ──────────────────────────────────────────────────────────────
  private showEnd() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setDepth(20);
    const p = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(21);

    const pct = Math.round((this.score / (ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? '⭐⭐⭐' : pct >= 60 ? '⭐⭐' : '⭐';

    const bg    = this.add.rectangle(0, 0, 340, 360, 0x0d2244).setStrokeStyle(3, 0x3a6a9a);
    const trop  = this.add.text(0, -148, '🏆', { fontSize: '52px' }).setOrigin(0.5);
    const title = this.add.text(0, -88, 'Hoàn thành!', { fontSize: '24px', color: '#f1c40f', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
    const st    = this.add.text(0, -42, stars, { fontSize: '36px' }).setOrigin(0.5);
    const sc    = this.add.text(0, 14, `Điểm: ${this.score} / ${ROUNDS * 10}  (${pct}%)`, { fontSize: '17px', color: '#ccddff', fontFamily: 'Arial' }).setOrigin(0.5);

    const mkBtn = (label: string, col: number, cy: number, fn: () => void) => {
      const b = this.add.rectangle(0, cy, 210, 50, col).setStrokeStyle(2, 0x5a8aba);
      b.setInteractive({ useHandCursor: true });
      b.on('pointerover', () => b.setAlpha(0.8)); b.on('pointerout', () => b.setAlpha(1));
      b.on('pointerdown', fn);
      const t = this.add.text(0, cy, label, { fontSize: '16px', color: '#fff', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
      return [b, t];
    };
    const [ab, at] = mkBtn('🔄 Chơi lại',  0x27ae60, 90, () => this.scene.restart());
    const [mb, mt] = mkBtn('🏠 Trang chủ', 0x2c3e50, 150, () => this.goToMenu());

    p.add([bg, trop, title, st, sc, ab, at, mb, mt]);
    p.setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: p, scaleX: 1, scaleY: 1, alpha: 1, ease: 'Back.easeOut', duration: 380 });
  }

  private goToMenu() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(SCENE_KEYS.MENU));
  }
}
