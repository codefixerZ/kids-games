import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS, COLORS } from '../../config';
import { QuizAPI, QuizQuestion, CATEGORIES } from './QuizAPI';
import { CharacterSprite } from './CharacterSprite';

// ─── Layout ───────────────────────────────────────────────────────────────
const HEADER_H   = 45;
const INFO_H     = 38;
const CHAR_Y     = HEADER_H + INFO_H + 10;   // ~93  owl center
const CHAR_X     = 66;
const BUBBLE_W   = GAME_WIDTH - CHAR_X - 54 - 20; // bubble fills right of owl
const ANSWER_TOP = CHAR_Y + 110;             // ~203  first button top
const BTN_H      = 98;
const BTN_GAP    = 8;
const BTN_X      = 8;
const BTN_W      = GAME_WIDTH - 16;
const QUESTIONS_PER_ROUND = 8;

type State = 'select' | 'loading' | 'playing' | 'feedback' | 'end';

export class QuizScene extends Phaser.Scene {
  private api!: QuizAPI;
  private character!: CharacterSprite;

  // Info bar
  private scoreText!: Phaser.GameObjects.Text;
  private streakText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private categoryBadge!: Phaser.GameObjects.Text;

  // Answer buttons (4)
  private answerBtns: Array<{ bg: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text; letter: Phaser.GameObjects.Text }> = [];

  // Overlay containers
  private selectContainer!: Phaser.GameObjects.Container;
  private playContainer!: Phaser.GameObjects.Container;
  private loadingText!: Phaser.GameObjects.Text;
  private feedbackOverlay!: Phaser.GameObjects.Container;
  private endOverlay!: Phaser.GameObjects.Container;

  // Game state
  private currentQuestion: QuizQuestion | null = null;
  private currentCategory = 'animals';
  private score = 0;
  private streak = 0;
  private questionCount = 0;
  private state: State = 'select';
  private answered = false;

  constructor() {
    super({ key: SCENE_KEYS.QUIZ });
  }

  create() {
    this.score = 0;
    this.streak = 0;
    this.questionCount = 0;
    this.answered = false;

    this.api = new QuizAPI();

    this.drawBackground();
    this.drawHeader();
    this.drawInfoBar();
    this.buildCharacter();
    this.buildAnswerButtons();
    this.buildLoadingIndicator();
    this.buildSelectScreen();
    this.buildFeedbackOverlay();
    this.buildEndOverlay();

    this.setState('select');

    this.api.init();

    this.events.once('shutdown', () => this.character?.destroy());
  }

  // ─── Background ───────────────────────────────────────────────────────────
  private drawBackground() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0d1b3e);

    // Decorative stars
    const gfx = this.add.graphics();
    gfx.fillStyle(0xffffff, 0.12);
    for (let i = 0; i < 50; i++) {
      gfx.fillCircle(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        Phaser.Math.Between(1, 2),
      );
    }
  }

  // ─── Header ────────────────────────────────────────────────────────────────
  private drawHeader() {
    this.add.rectangle(GAME_WIDTH / 2, HEADER_H / 2, GAME_WIDTH, HEADER_H, 0x0a1628);

    const back = this.add.text(14, 13, '⬅ Home', {
      fontSize: '14px', color: '#aaaacc', fontFamily: 'Arial',
    });
    back.setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#ffffff'));
    back.on('pointerout',  () => back.setColor('#aaaacc'));
    back.on('pointerdown', () => this.goToMenu());

    this.add.text(GAME_WIDTH / 2, 13, '🧠 Quiz Phiêu Lưu', {
      fontSize: '17px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.scoreText = this.add.text(GAME_WIDTH - 14, 13, '⭐ 0', {
      fontSize: '16px', color: '#f1c40f', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(1, 0);
  }

  // ─── Info bar (below header) ───────────────────────────────────────────────
  private drawInfoBar() {
    const y = HEADER_H;
    this.add.rectangle(GAME_WIDTH / 2, y + INFO_H / 2, GAME_WIDTH, INFO_H, 0x111f3a);

    this.categoryBadge = this.add.text(12, y + INFO_H / 2, '', {
      fontSize: '13px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      backgroundColor: '#1a4a2a', padding: { x: 8, y: 3 },
    }).setOrigin(0, 0.5);

    this.streakText = this.add.text(GAME_WIDTH / 2, y + INFO_H / 2, '', {
      fontSize: '13px', color: '#f39c12', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.progressText = this.add.text(GAME_WIDTH - 12, y + INFO_H / 2, '', {
      fontSize: '13px', color: '#aaaacc', fontFamily: 'Arial',
    }).setOrigin(1, 0.5);
  }

  // ─── Owl character ─────────────────────────────────────────────────────────
  private buildCharacter() {
    this.character = new CharacterSprite(this, CHAR_X, CHAR_Y, BUBBLE_W);
    this.character.setText('Chào mừng!\nChọn chủ đề nhé!');
  }

  // ─── Answer buttons ────────────────────────────────────────────────────────
  private buildAnswerButtons() {
    const LETTERS = ['A', 'B', 'C', 'D'];
    this.answerBtns = [];

    for (let i = 0; i < 4; i++) {
      const by = ANSWER_TOP + i * (BTN_H + BTN_GAP);
      const cx = BTN_X + BTN_W / 2;
      const cy = by + BTN_H / 2;

      const bg = this.add.rectangle(cx, cy, BTN_W, BTN_H, 0x1a3060);
      bg.setStrokeStyle(2, 0x3355aa);
      bg.setInteractive({ useHandCursor: true });

      const letterCircle = this.add.circle(BTN_X + 30, cy, 18, 0x2255cc);
      const letter = this.add.text(BTN_X + 30, cy, LETTERS[i], {
        fontSize: '17px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5);

      const label = this.add.text(BTN_X + 56, cy, '', {
        fontSize: '16px', color: '#e8e8f0', fontFamily: 'Arial',
        wordWrap: { width: BTN_W - 70 },
      }).setOrigin(0, 0.5);

      const idx = i;
      bg.on('pointerover', () => { if (!this.answered) bg.setFillStyle(0x224488); });
      bg.on('pointerout',  () => { if (!this.answered) bg.setFillStyle(0x1a3060); });
      bg.on('pointerdown', () => this.handleAnswer(idx));

      this.answerBtns.push({ bg, label, letter });
      // hide until playing
      [bg, letterCircle, letter, label].forEach(o => o.setVisible(false));
      // store letterCircle on bg for later show/hide
      (bg as unknown as { _circle: Phaser.GameObjects.Arc })._circle = letterCircle;
    }
  }

  // ─── Loading indicator ─────────────────────────────────────────────────────
  private buildLoadingIndicator() {
    this.loadingText = this.add.text(GAME_WIDTH / 2, ANSWER_TOP + 180, '✨ Đang tạo câu hỏi...', {
      fontSize: '16px', color: '#aaaacc', fontFamily: 'Arial',
    }).setOrigin(0.5).setVisible(false);
  }

  // ─── Category select screen ────────────────────────────────────────────────
  private buildSelectScreen() {
    this.selectContainer = this.add.container(0, 0);

    const bg = this.add.rectangle(GAME_WIDTH / 2, ANSWER_TOP + 240, GAME_WIDTH, 520, 0x0d1b3e);
    this.selectContainer.add(bg);

    const title = this.add.text(GAME_WIDTH / 2, ANSWER_TOP + 10, 'Chọn chủ đề của bạn:', {
      fontSize: '17px', color: '#ccddff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.selectContainer.add(title);

    const cardW = (GAME_WIDTH - 30) / 2;
    const cardH = 86;
    const cols = 2;

    CATEGORIES.forEach((cat, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = 10 + cardW / 2 + col * (cardW + 10);
      const cy = ANSWER_TOP + 55 + row * (cardH + 10) + cardH / 2;

      const cardBg = this.add.rectangle(cx, cy, cardW, cardH, 0x162040);
      cardBg.setStrokeStyle(2, cat.color);
      cardBg.setInteractive({ useHandCursor: true });

      const emojiT = this.add.text(cx - cardW / 2 + 20, cy, cat.emoji, {
        fontSize: '34px',
      }).setOrigin(0, 0.5);

      const labelT = this.add.text(cx - cardW / 2 + 60, cy, cat.label, {
        fontSize: '15px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      cardBg.on('pointerover', () => cardBg.setFillStyle(0x1e3060));
      cardBg.on('pointerout',  () => cardBg.setFillStyle(0x162040));
      cardBg.on('pointerdown', () => this.startCategory(cat.id));

      this.selectContainer.add([cardBg, emojiT, labelT]);
    });
  }

  // ─── Feedback overlay ──────────────────────────────────────────────────────
  private buildFeedbackOverlay() {
    this.feedbackOverlay = this.add.container(GAME_WIDTH / 2, ANSWER_TOP + 220);
    this.feedbackOverlay.setVisible(false).setDepth(20);
  }

  // ─── End overlay ───────────────────────────────────────────────────────────
  private buildEndOverlay() {
    this.endOverlay = this.add.container(0, 0);
    this.endOverlay.setVisible(false).setDepth(30);
  }

  // ─── State machine ─────────────────────────────────────────────────────────
  private setState(s: State) {
    this.state = s;

    const showAnswers   = s === 'playing' || s === 'feedback';
    this.answerBtns.forEach(b => {
      b.bg.setVisible(showAnswers);
      b.label.setVisible(showAnswers);
      b.letter.setVisible(showAnswers);
      const circle = (b.bg as unknown as { _circle?: Phaser.GameObjects.Arc })._circle;
      circle?.setVisible(showAnswers);
    });

    this.selectContainer.setVisible(s === 'select');
    this.loadingText.setVisible(s === 'loading');
    this.feedbackOverlay.setVisible(s === 'feedback');
    this.endOverlay.setVisible(s === 'end');

    // Info bar
    const showInfo = s !== 'select';
    this.categoryBadge.setVisible(showInfo);
    this.streakText.setVisible(showInfo);
    this.progressText.setVisible(showInfo);
  }

  // ─── Start a category ──────────────────────────────────────────────────────
  private async startCategory(categoryId: string) {
    this.currentCategory = categoryId;
    this.score = 0;
    this.streak = 0;
    this.questionCount = 0;
    this.answered = false;

    const cat = CATEGORIES.find(c => c.id === categoryId)!;
    this.categoryBadge.setText(`${cat.emoji} ${cat.label}`);
    this.updateInfoBar();
    this.scoreText.setText('⭐ 0');

    await this.loadNextQuestion();
  }

  // ─── Load next question ────────────────────────────────────────────────────
  private async loadNextQuestion() {
    this.setState('loading');
    this.answered = false;
    this.character.thinking();
    this.character.setText('🤔 Hmm...\nĐể tớ nghĩ xem...');

    try {
      const q = await this.api.getQuestion(this.currentCategory);
      this.currentQuestion = q;
      this.showQuestion(q);
    } catch (err) {
      console.error('[QuizScene] Failed to load question:', err);
      this.character.setText('😅 Ôi không!\nThử lại nào...');
      this.time.delayedCall(1500, () => this.loadNextQuestion());
    }
  }

  // ─── Show question ─────────────────────────────────────────────────────────
  private showQuestion(q: QuizQuestion) {
    this.setState('playing');
    this.character.setText(q.question);

    const LETTERS = ['A', 'B', 'C', 'D'];
    this.answerBtns.forEach((b, i) => {
      b.bg.setFillStyle(0x1a3060);
      b.bg.setStrokeStyle(2, 0x3355aa);
      b.bg.setAlpha(1);
      b.label.setText(q.options[i] ?? '');
      b.letter.setText(LETTERS[i]);
    });

    // Entrance animation for buttons
    this.answerBtns.forEach((b, i) => {
      b.bg.setAlpha(0);
      b.label.setAlpha(0);
      this.tweens.add({
        targets: [b.bg, b.label, b.letter],
        alpha: 1,
        x: `+=${0}`,
        duration: 200,
        delay: i * 60,
        ease: 'Back.easeOut',
      });
    });
  }

  // ─── Handle answer ─────────────────────────────────────────────────────────
  private handleAnswer(idx: number) {
    if (this.state !== 'playing' || this.answered || !this.currentQuestion) return;
    this.answered = true;

    const correct = idx === this.currentQuestion.correct;

    // Highlight correct / wrong
    this.answerBtns.forEach((b, i) => {
      b.bg.disableInteractive();
      if (i === this.currentQuestion!.correct) {
        b.bg.setFillStyle(0x1a5c1a);
        b.bg.setStrokeStyle(3, 0x2ecc71);
      } else if (i === idx && !correct) {
        b.bg.setFillStyle(0x5c1a1a);
        b.bg.setStrokeStyle(3, 0xe74c3c);
      }
    });

    if (correct) {
      this.streak++;
      const bonus = this.streak >= 3 ? 20 : 10;
      this.score += bonus;
      this.character.happy();
      this.character.setText(`🎉 Tuyệt vời!\n+${bonus} điểm!`);
    } else {
      this.streak = 0;
      this.character.sad();
      this.character.setText(`😢 Chưa đúng...\n${this.currentQuestion.explanation}`);
    }

    this.scoreText.setText(`⭐ ${this.score}`);
    this.updateInfoBar();
    this.setState('feedback');
    this.showFeedbackPanel(correct);

    this.questionCount++;

    this.time.delayedCall(1800, () => {
      if (this.questionCount >= QUESTIONS_PER_ROUND) {
        this.showEndScreen();
      } else {
        this.loadNextQuestion();
      }
    });
  }

  // ─── Feedback panel (brief overlay) ───────────────────────────────────────
  private showFeedbackPanel(correct: boolean) {
    this.feedbackOverlay.removeAll(true);
    this.feedbackOverlay.setVisible(true);

    const w = 260;
    const h = 60;
    const color  = correct ? 0x1a5c1a : 0x5c1a1a;
    const border = correct ? 0x2ecc71 : 0xe74c3c;
    const msg    = correct ? '✅ Đúng rồi!' : '❌ Sai rồi!';
    const streak = correct && this.streak >= 3 ? `\n🔥 Chuỗi ${this.streak}!` : '';

    const bg = this.add.rectangle(0, 0, w, h, color);
    bg.setStrokeStyle(2, border);
    this.feedbackOverlay.add(bg);

    this.feedbackOverlay.add(this.add.text(0, 0, msg + streak, {
      fontSize: '20px', color: correct ? '#2ecc71' : '#e74c3c',
      fontFamily: 'Arial', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5));
  }

  // ─── End screen ────────────────────────────────────────────────────────────
  private showEndScreen() {
    this.setState('end');
    this.endOverlay.removeAll(true);
    this.endOverlay.setVisible(true);

    // Dim backdrop
    this.endOverlay.add(
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7),
    );

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const W  = GAME_WIDTH - 40;
    const H  = 320;

    const panel = this.add.rectangle(cx, cy, W, H, 0x0f3460);
    panel.setStrokeStyle(3, 0xe94560);
    this.endOverlay.add(panel);

    this.endOverlay.add(this.add.text(cx, cy - H / 2 + 28, '🏆 Kết thúc!', {
      fontSize: '28px', color: '#f1c40f', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0));

    this.endOverlay.add(this.add.text(cx, cy - H / 2 + 72, `Tổng điểm: ${this.score}`, {
      fontSize: '32px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0));

    const accuracy = Math.round((this.score / (QUESTIONS_PER_ROUND * 10)) * 100);
    this.endOverlay.add(this.add.text(cx, cy - H / 2 + 116, `${QUESTIONS_PER_ROUND} câu  •  ${accuracy}% đúng`, {
      fontSize: '15px', color: '#aaaacc', fontFamily: 'Arial',
    }).setOrigin(0.5, 0));

    // Rank
    const rank = this.score >= 70 ? '⭐⭐⭐ Xuất sắc!' : this.score >= 50 ? '⭐⭐ Giỏi lắm!' : '⭐ Cố gắng nhé!';
    this.endOverlay.add(this.add.text(cx, cy - H / 2 + 148, rank, {
      fontSize: '18px', color: '#f39c12', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0));

    // Play Again
    const again = this.add.rectangle(cx - 80, cy + H / 2 - 44, 140, 44, 0x2ecc71);
    again.setInteractive({ useHandCursor: true });
    again.on('pointerdown', () => {
      this.endOverlay.setVisible(false);
      this.setState('select');
      this.character.setText('Chào mừng!\nChọn chủ đề nhé!');
    });
    this.endOverlay.add(again);
    this.endOverlay.add(this.add.text(cx - 80, cy + H / 2 - 44, '▶ Chơi lại', {
      fontSize: '15px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5));

    // Menu
    const menu = this.add.rectangle(cx + 80, cy + H / 2 - 44, 140, 44, 0x555577);
    menu.setInteractive({ useHandCursor: true });
    menu.on('pointerdown', () => this.goToMenu());
    this.endOverlay.add(menu);
    this.endOverlay.add(this.add.text(cx + 80, cy + H / 2 - 44, '⬅ Trang chủ', {
      fontSize: '15px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5));
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  private updateInfoBar() {
    this.progressText.setText(`${this.questionCount + 1} / ${QUESTIONS_PER_ROUND}`);
    this.streakText.setText(this.streak >= 3 ? `🔥 ×${this.streak}` : this.streak >= 2 ? `✨ ×${this.streak}` : '');
  }

  private goToMenu() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENE_KEYS.MENU);
    });
  }
}
