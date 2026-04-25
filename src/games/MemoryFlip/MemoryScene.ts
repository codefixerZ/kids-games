import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS, COLORS } from '../../config';
import { GlobalProgressState } from '../../state/GlobalProgressState';
import { MemoryCard, CardData } from './MemoryCard';

// ─── Layout ────────────────────────────────────────────────────────────────
const HEADER_H = 45;
const INFO_H   = 40;
const GRID_TOP = HEADER_H + INFO_H + 8;
const GAP      = 8;

// ─── Difficulty config ─────────────────────────────────────────────────────
interface Difficulty { id: string; label: string; emoji: string; cols: number; rows: number; color: number }
const DIFFICULTIES: Difficulty[] = [
  { id: 'easy',   label: 'Dễ',        emoji: '🌟',     cols: 3, rows: 4, color: 0x27ae60 },
  { id: 'medium', label: 'Trung bình',emoji: '⭐⭐',   cols: 4, rows: 4, color: 0x2980b9 },
  { id: 'hard',   label: 'Khó',       emoji: '🔥',     cols: 4, rows: 5, color: 0xe74c3c },
];

const BUILT_IN_CARDS: CardData[] = [
  { id: 'cat',      emoji: '🐱', color: 0x8e44ad },
  { id: 'dog',      emoji: '🐶', color: 0xe67e22 },
  { id: 'frog',     emoji: '🐸', color: 0x27ae60 },
  { id: 'panda',    emoji: '🐼', color: 0x2c3e50 },
  { id: 'fox',      emoji: '🦊', color: 0xd35400 },
  { id: 'tiger',    emoji: '🐯', color: 0xe67e22 },
  { id: 'koala',    emoji: '🐨', color: 0x7f8c8d },
  { id: 'lion',     emoji: '🦁', color: 0xf39c12 },
  { id: 'cow',      emoji: '🐮', color: 0x27ae60 },
  { id: 'pig',      emoji: '🐷', color: 0xe74c3c },
  { id: 'butterfly',emoji: '🦋', color: 0x9b59b6 },
  { id: 'turtle',   emoji: '🐢', color: 0x1abc9c },
  { id: 'unicorn',  emoji: '🦄', color: 0xf64dba },
  { id: 'penguin',  emoji: '🐧', color: 0x2980b9 },
  { id: 'elephant', emoji: '🐘', color: 0x7f8c8d },
  { id: 'dolphin',  emoji: '🐬', color: 0x3498db },
  { id: 'eagle',    emoji: '🦅', color: 0x8e6b3e },
  { id: 'crab',     emoji: '🦀', color: 0xc0392b },
  { id: 'octopus',  emoji: '🐙', color: 0x8e44ad },
  { id: 'giraffe',  emoji: '🦒', color: 0xf39c12 },
];

export class MemoryScene extends Phaser.Scene {
  // UI elements
  private timerText!:   Phaser.GameObjects.Text;
  private movesText!:   Phaser.GameObjects.Text;
  private pairsText!:   Phaser.GameObjects.Text;
  private selectScreen!: Phaser.GameObjects.Container;
  private winOverlay!:   Phaser.GameObjects.Container;

  // Game state
  private cards: MemoryCard[] = [];
  private flipped: MemoryCard[] = [];
  private matchedPairs = 0;
  private totalPairs   = 0;
  private moves        = 0;
  private lockBoard    = false;
  private seconds      = 0;
  private timerEvent?: Phaser.Time.TimerEvent;
  private deck: CardData[] = BUILT_IN_CARDS;
  private currentDiff!: Difficulty;

  constructor() { super({ key: SCENE_KEYS.MEMORY }); }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────
  create() {
    this.matchedPairs = 0;
    this.moves = 0;
    this.seconds = 0;
    this.lockBoard = false;
    this.flipped = [];
    this.cards = [];

    this.drawBackground();
    this.drawHeader();
    this.drawInfoBar();
    this.buildSelectScreen();
    this.buildWinOverlay();

    // Listen for card taps (emitted by each card)
    this.events.on('card-tapped', this.handleCardTap, this);
    this.events.once('shutdown', () => this.cleanup());

    // Load custom deck if present
    fetch(import.meta.env.BASE_URL + 'config/memory-cards.json')
      .then(r => r.ok ? r.json() : null)
      .then((data: CardData[] | null) => { if (data?.length) this.deck = data; })
      .catch(() => {});

    this.showSelectScreen();
  }

  // ─── Background ─────────────────────────────────────────────────────────────
  private drawBackground() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0d1f35);
    const gfx = this.add.graphics();
    gfx.fillStyle(0xffffff, 0.04);
    for (let i = 0; i < 40; i++) {
      gfx.fillCircle(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        Phaser.Math.Between(1, 2),
      );
    }
  }

  // ─── Header ─────────────────────────────────────────────────────────────────
  private drawHeader() {
    this.add.rectangle(GAME_WIDTH / 2, HEADER_H / 2, GAME_WIDTH, HEADER_H, 0x0a1628).setDepth(10);
    const back = this.add.text(14, 13, '⬅ Home', {
      fontSize: '14px', color: '#aaaacc', fontFamily: 'Arial',
    }).setDepth(10);
    back.setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#ffffff'));
    back.on('pointerout',  () => back.setColor('#aaaacc'));
    back.on('pointerdown', () => this.goToMenu());

    this.add.text(GAME_WIDTH / 2, 13, '🐾 Lật Thẻ Nhớ', {
      fontSize: '17px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(10);
  }

  // ─── Info bar ───────────────────────────────────────────────────────────────
  private drawInfoBar() {
    this.add.rectangle(GAME_WIDTH / 2, HEADER_H + INFO_H / 2, GAME_WIDTH, INFO_H, 0x111f3a);

    const y = HEADER_H + INFO_H / 2;
    this.movesText = this.add.text(14, y, '🖐 0 lượt', {
      fontSize: '14px', color: '#f1c40f', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    this.pairsText = this.add.text(GAME_WIDTH / 2, y, '', {
      fontSize: '14px', color: '#2ecc71', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    this.timerText = this.add.text(GAME_WIDTH - 14, y, '⏱ 0s', {
      fontSize: '14px', color: '#aaaacc', fontFamily: 'Arial',
    }).setOrigin(1, 0.5);
  }

  // ─── Difficulty select screen ────────────────────────────────────────────────
  private buildSelectScreen() {
    this.selectScreen = this.add.container(0, 0).setDepth(5);

    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0d1f35);
    this.selectScreen.add(bg);

    this.selectScreen.add(this.add.text(GAME_WIDTH / 2, 130, '🐾 Lật Thẻ Nhớ', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0));

    this.selectScreen.add(this.add.text(GAME_WIDTH / 2, 175, 'Chọn độ khó:', {
      fontSize: '17px', color: '#aaaacc', fontFamily: 'Arial',
    }).setOrigin(0.5, 0));

    const btnW = GAME_WIDTH - 60;
    const btnH = 100;
    const startY = 230;

    DIFFICULTIES.forEach((diff, i) => {
      const cy = startY + i * (btnH + 16) + btnH / 2;
      const cx = GAME_WIDTH / 2;

      const btn = this.add.rectangle(cx, cy, btnW, btnH, 0x162040);
      btn.setStrokeStyle(2, diff.color);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setFillStyle(0x1e3060));
      btn.on('pointerout',  () => btn.setFillStyle(0x162040));
      btn.on('pointerdown', () => this.startGame(diff));

      const emojiT = this.add.text(cx - btnW / 2 + 28, cy, diff.emoji, {
        fontSize: '38px',
      }).setOrigin(0, 0.5);

      const labelT = this.add.text(cx - btnW / 2 + 80, cy - 14, diff.label, {
        fontSize: '22px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      const pairs = (diff.cols * diff.rows) / 2;
      const subT = this.add.text(cx - btnW / 2 + 80, cy + 14, `${diff.cols}×${diff.rows} — ${pairs} cặp thẻ`, {
        fontSize: '13px', color: '#8899bb', fontFamily: 'Arial',
      }).setOrigin(0, 0.5);

      this.selectScreen.add([btn, emojiT, labelT, subT]);
    });
  }

  private showSelectScreen() {
    this.selectScreen.setVisible(true);
    this.pairsText.setText('');
    this.movesText.setText('🖐 0 lượt');
    this.timerText.setText('⏱ 0s');
  }

  // ─── Start game ─────────────────────────────────────────────────────────────
  private startGame(diff: Difficulty) {
    this.currentDiff = diff;
    this.selectScreen.setVisible(false);

    this.matchedPairs = 0;
    this.totalPairs   = (diff.cols * diff.rows) / 2;
    this.moves        = 0;
    this.seconds      = 0;
    this.lockBoard    = false;
    this.flipped      = [];

    this.updateInfoBar();

    // Clear old cards
    this.cards.forEach(c => c.destroy());
    this.cards = [];

    this.buildGrid(diff);
    this.startTimer();
  }

  // ─── Build card grid ────────────────────────────────────────────────────────
  private buildGrid(diff: Difficulty) {
    const { cols, rows } = diff;
    const totalCards = cols * rows;

    // Pick random pairs from deck
    const pool = Phaser.Utils.Array.Shuffle([...this.deck]).slice(0, totalCards / 2) as CardData[];
    const doubled = Phaser.Utils.Array.Shuffle([...pool, ...pool]) as CardData[];

    // Card sizing: fill available width, keep square, centre vertically
    const gridW    = GAME_WIDTH - 16;
    const cardSize = Math.min(
      Math.floor((gridW - GAP * (cols - 1)) / cols),
      Math.floor((GAME_HEIGHT - GRID_TOP - 10 - GAP * (rows - 1)) / rows),
      120,
    );
    const totalGridW = cols * cardSize + (cols - 1) * GAP;
    const totalGridH = rows * cardSize + (rows - 1) * GAP;
    const startX     = (GAME_WIDTH - totalGridW) / 2 + cardSize / 2;
    const startY     = GRID_TOP + (GAME_HEIGHT - GRID_TOP - 10 - totalGridH) / 2 + cardSize / 2;

    doubled.forEach((data, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x   = startX + col * (cardSize + GAP);
      const y   = startY + row * (cardSize + GAP);
      const card = new MemoryCard(this, x, y, cardSize, cardSize, data);
      card.enable();

      // Brief entrance animation
      const container = (card as unknown as { container: Phaser.GameObjects.Container }).container;
      // animate via scale from 0 with stagger
      this.tweens.add({
        targets: (card as unknown as { container: Phaser.GameObjects.Container }).container ?? card,
        alpha: { from: 0, to: 1 },
        scaleX: { from: 0.3, to: 1 },
        scaleY: { from: 0.3, to: 1 },
        duration: 250,
        delay: idx * 30,
        ease: 'Back.easeOut',
      });

      this.cards.push(card);
    });
  }

  // ─── Card tap handler ────────────────────────────────────────────────────────
  private handleCardTap(card: MemoryCard) {
    if (this.lockBoard) return;
    if (this.flipped.includes(card)) return;

    card.flipUp();
    this.flipped.push(card);

    if (this.flipped.length === 2) {
      this.lockBoard = true;
      this.moves++;
      this.updateInfoBar();
      this.checkMatch();
    }
  }

  private checkMatch() {
    const [a, b] = this.flipped;
    if (a.data.id === b.data.id) {
      // ✅ Match!
      this.time.delayedCall(400, () => {
        a.celebrate();
        b.celebrate();
        this.matchedPairs++;
        this.updateInfoBar();
        this.flipped = [];
        this.lockBoard = false;
        if (this.matchedPairs === this.totalPairs) {
          this.time.delayedCall(600, () => this.showWin());
        }
      });
    } else {
      // ❌ No match — shake then flip back
      this.time.delayedCall(700, () => {
        let done = 0;
        const onShakeDone = () => {
          done++;
          if (done === 2) {
            a.flipDown();
            b.flipDown(() => {
              this.flipped = [];
              this.lockBoard = false;
            });
          }
        };
        a.shake(onShakeDone);
        b.shake(onShakeDone);
      });
    }
  }

  // ─── Timer ──────────────────────────────────────────────────────────────────
  private startTimer() {
    this.timerEvent?.destroy();
    this.seconds = 0;
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: -1,
      callback: () => {
        this.seconds++;
        this.timerText.setText(`⏱ ${this.seconds}s`);
      },
    });
  }

  private stopTimer() {
    this.timerEvent?.destroy();
    this.timerEvent = undefined;
  }

  // ─── Info bar update ────────────────────────────────────────────────────────
  private updateInfoBar() {
    this.movesText.setText(`🖐 ${this.moves} lượt`);
    this.pairsText.setText(
      this.totalPairs > 0 ? `${this.matchedPairs} / ${this.totalPairs} cặp` : '',
    );
  }

  // ─── Win screen ─────────────────────────────────────────────────────────────
  private buildWinOverlay() {
    this.winOverlay = this.add.container(0, 0).setDepth(20).setVisible(false);
  }

  private showWin() {
    this.stopTimer();

    this.winOverlay.removeAll(true);
    this.winOverlay.setVisible(true);

    // Dim backdrop
    this.winOverlay.add(
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65),
    );

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const W  = GAME_WIDTH - 40;
    const H  = 300;

    const panel = this.add.rectangle(cx, cy, W, H, 0x0f3460);
    panel.setStrokeStyle(3, 0xf1c40f);
    this.winOverlay.add(panel);

    // Stars
    const stars = this.calcStars();
    GlobalProgressState.getInstance().recordPlay(
      SCENE_KEYS.MEMORY, stars as 1 | 2 | 3, this.seconds * 1000,
    );
    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    this.winOverlay.add(this.add.text(cx, cy - H / 2 + 22, starStr, {
      fontSize: '38px',
    }).setOrigin(0.5, 0));

    this.winOverlay.add(this.add.text(cx, cy - H / 2 + 72, '🎉 Tuyệt vời!', {
      fontSize: '26px', color: '#f1c40f', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0));

    this.winOverlay.add(this.add.text(cx, cy - H / 2 + 108, `${this.moves} lượt  •  ${this.seconds}s`, {
      fontSize: '18px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5, 0));

    const diff = this.currentDiff;
    this.winOverlay.add(this.add.text(cx, cy - H / 2 + 140, `Độ khó: ${diff.label}`, {
      fontSize: '14px', color: '#8899bb', fontFamily: 'Arial',
    }).setOrigin(0.5, 0));

    // Play Again
    const againBg = this.add.rectangle(cx - 82, cy + H / 2 - 44, 145, 46, 0x2ecc71);
    againBg.setInteractive({ useHandCursor: true });
    againBg.on('pointerdown', () => {
      this.winOverlay.setVisible(false);
      this.startGame(diff);
    });
    this.winOverlay.add(againBg);
    this.winOverlay.add(this.add.text(cx - 82, cy + H / 2 - 44, '▶ Chơi lại', {
      fontSize: '15px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5));

    // Menu
    const menuBg = this.add.rectangle(cx + 82, cy + H / 2 - 44, 145, 46, 0x555577);
    menuBg.setInteractive({ useHandCursor: true });
    menuBg.on('pointerdown', () => {
      this.winOverlay.setVisible(false);
      this.cards.forEach(c => c.destroy());
      this.cards = [];
      this.showSelectScreen();
    });
    this.winOverlay.add(menuBg);
    this.winOverlay.add(this.add.text(cx + 82, cy + H / 2 - 44, '🔄 Chủ đề khác', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5));
  }

  private calcStars(): number {
    const minMoves = this.totalPairs; // perfect = exactly totalPairs moves
    if (this.moves <= minMoves + 2)  return 3;
    if (this.moves <= minMoves * 2)  return 2;
    return 1;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────
  private cleanup() {
    this.events.off('card-tapped', this.handleCardTap, this);
    this.stopTimer();
    this.cards.forEach(c => c.destroy());
  }

  private goToMenu() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENE_KEYS.WORLD_MAP);
    });
  }
}
