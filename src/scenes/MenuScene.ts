import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS, COLORS } from '../config';

interface GameCard {
  key: string;
  title: string;
  description: string;
  emoji: string;
  color: number;
}

const GAMES: GameCard[] = [
  {
    key: SCENE_KEYS.DRAW_GUESS,
    title: 'Vẽ & Đoán',
    description: 'Vẽ và để AI đoán!',
    emoji: '🎨',
    color: 0xe94560,
  },
  {
    key: SCENE_KEYS.QUIZ,
    title: 'Quiz Phiêu Lưu',
    description: 'Trả lời câu hỏi vui!',
    emoji: '🧠',
    color: 0x9b59b6,
  },
  {
    key: SCENE_KEYS.MEMORY,
    title: 'Lật Thẻ Nhớ',
    description: 'Tìm cặp giống nhau!',
    emoji: '🐾',
    color: 0x16a085,
  },
  {
    key: SCENE_KEYS.COUNTING,
    title: 'Học Đếm Số',
    description: 'Đếm và chọn số đúng!',
    emoji: '🔢',
    color: 0xe67e22,
  },
  {
    key: SCENE_KEYS.ROTATE_PUZZLE,
    title: 'Ghép Hình Xoay',
    description: 'Xoay ô để ghép tranh!',
    emoji: '📘',
    color: 0x2980b9,
  },
  {
    key: SCENE_KEYS.ODD_ONE_OUT,
    title: 'Tìm Khác Biệt',
    description: 'Tìm hình không giống!',
    emoji: '📖',
    color: 0x27ae60,
  },
  {
    key: SCENE_KEYS.COLORING,
    title: 'Tô Màu Sáng Tạo',
    description: 'Tô màu và lưu tranh!',
    emoji: '🖌️',
    color: 0xf39c12,
  },
  {
    key: SCENE_KEYS.TIC_TAC_TOE,
    title: 'X O Fun',
    description: 'Đấu Tic Tac Toe vs AI!',
    emoji: '✖⭕',
    color: 0x8e44ad,
  },
];

// ── Layout constants ──────────────────────────────────────────────────────────
const COLS     = 2;
const CARD_W   = 216;
const CARD_H   = 148;
const GAP_X    = 12;
const GAP_Y    = 12;
const START_Y  = 178;   // top of first row (card centre)
const TOTAL_W  = COLS * CARD_W + (COLS - 1) * GAP_X;   // 444
const START_X  = (GAME_WIDTH - TOTAL_W) / 2;            // 18

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.MENU });
  }

  create() {
    this.drawBackground();
    this.drawTitle();
    this.drawGameCards();
  }

  private drawBackground() {
    const gfx = this.add.graphics();
    gfx.fillStyle(COLORS.BG_DARK);
    gfx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    gfx.fillStyle(0xffffff, 0.05);
    for (let i = 0; i < 40; i++) {
      gfx.fillCircle(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        Phaser.Math.Between(1, 3),
      );
    }
  }

  private drawTitle() {
    this.add.text(GAME_WIDTH / 2, 46, '🎮 Kids Games', {
      fontSize: '34px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 98, 'Chọn trò chơi để bắt đầu!', {
      fontSize: '16px',
      color: '#aaaacc',
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5);
  }

  private drawGameCards() {
    GAMES.forEach((game, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cx  = START_X + col * (CARD_W + GAP_X) + CARD_W / 2;
      const cy  = START_Y + row * (CARD_H + GAP_Y) + CARD_H / 2;
      this.createCard(cx, cy, CARD_W, CARD_H, game);
    });
  }

  private createCard(x: number, y: number, w: number, h: number, game: GameCard) {
    const container = this.add.container(x, y);

    const shadow = this.add.rectangle(3, 3, w, h, 0x000000, 0.35).setOrigin(0.5);
    const bg     = this.add.rectangle(0, 0, w, h, COLORS.BG_CARD).setOrigin(0.5);
    bg.setStrokeStyle(2, game.color);

    // colour stripe along the top
    const stripe = this.add.rectangle(0, -h / 2 + 5, w, 10, game.color).setOrigin(0.5, 0);

    const emoji = this.add.text(0, -28, game.emoji, {
      fontSize: '42px',
    }).setOrigin(0.5);

    const title = this.add.text(0, 28, game.title, {
      fontSize: '16px', color: '#ffffff',
      fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      align: 'center', wordWrap: { width: w - 16 },
    }).setOrigin(0.5);

    const desc = this.add.text(0, 56, game.description, {
      fontSize: '11px', color: '#8899bb',
      fontFamily: 'Arial, sans-serif', align: 'center',
    }).setOrigin(0.5);

    container.add([shadow, bg, stripe, emoji, title, desc]);

    // Entrance pop-in
    container.setScale(0.7).setAlpha(0);
    const idx = GAMES.findIndex(g => g.key === game.key);
    this.tweens.add({
      targets: container, scaleX: 1, scaleY: 1, alpha: 1,
      ease: 'Back.easeOut', duration: 300, delay: idx * 60,
    });

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.setFillStyle(0x0f3460);
      this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 100 });
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(COLORS.BG_CARD);
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
    });
    bg.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(game.key));
    });
  }
}
