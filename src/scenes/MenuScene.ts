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
    description: 'Vẽ thứ gì đó và AI sẽ\nđoán xem nó là gì!',
    emoji: '🎨',
    color: 0xe94560,
  },
  {
    key: SCENE_KEYS.QUIZ,
    title: 'Quiz Phiêu Lưu',
    description: 'Trả lời câu hỏi về\nđộng vật, toán học...',
    emoji: '🧠',
    color: 0x9b59b6,
  },
];

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
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      gfx.fillCircle(x, y, Phaser.Math.Between(1, 3));
    }
  }

  private drawTitle() {
    this.add.text(GAME_WIDTH / 2, 100, '🎮 Kids Games', {
      fontSize: '40px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 155, 'Chọn trò chơi để bắt đầu!', {
      fontSize: '18px',
      color: '#aaaacc',
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5);
  }

  private drawGameCards() {
    const cardW = Math.min(320, GAME_WIDTH - 60);
    const cardH = 190;
    const cx = GAME_WIDTH / 2;
    const startY = 220;
    const gap = 20;

    GAMES.forEach((game, i) => {
      const y = startY + i * (cardH + gap) + cardH / 2;
      this.createCard(cx, y, cardW, cardH, game);
    });
  }

  private createCard(x: number, y: number, w: number, h: number, game: GameCard) {
    const container = this.add.container(x, y);

    const shadow = this.add.rectangle(4, 4, w, h, 0x000000, 0.3).setOrigin(0.5);
    const bg = this.add.rectangle(0, 0, w, h, COLORS.BG_CARD).setOrigin(0.5);
    bg.setStrokeStyle(2, game.color, 1);

    const stripe = this.add.rectangle(0, -h / 2 + 6, w, 12, game.color).setOrigin(0.5, 0);

    const emoji = this.add.text(0, -50, game.emoji, {
      fontSize: '56px',
    }).setOrigin(0.5);

    const title = this.add.text(0, 22, game.title, {
      fontSize: '22px', color: '#ffffff',
      fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);

    const desc = this.add.text(0, 60, game.description, {
      fontSize: '14px', color: '#aaaacc',
      fontFamily: 'Arial, sans-serif', align: 'center',
    }).setOrigin(0.5);

    container.add([shadow, bg, stripe, emoji, title, desc]);

    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      bg.setFillStyle(0x0f3460);
      this.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 100 });
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(COLORS.BG_CARD);
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
    });
    bg.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(game.key);
      });
    });
  }
}
