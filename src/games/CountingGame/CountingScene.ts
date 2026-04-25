import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS } from '../../config';
import { GlobalProgressState } from '../../state/GlobalProgressState';

// ── Layout ────────────────────────────────────────────────────────────────────
const HEADER_H   = 45;
const QUESTION_H = 82;
const OBJ_TOP    = HEADER_H + QUESTION_H;   // 127
const OBJ_BOT    = 608;                      // objects area bottom
const FB_Y       = OBJ_BOT + 22;            // feedback banner centre-y
const BTN_TOP    = FB_Y + 22;               // 652 — buttons start here
const BTN_W      = 84;
const BTN_H      = 74;
const BTN_GAP    = 10;                       // gap between buttons
const BTN_ROW_H  = BTN_H + 10;             // row pitch

// ── Game settings ─────────────────────────────────────────────────────────────
const MAX_COUNT = 10;
const ROUNDS    = 10;

const OBJECT_TYPES = [
  { emoji: '🐱', name: 'con mèo' },
  { emoji: '🐶', name: 'con chó' },
  { emoji: '🐸', name: 'con ếch' },
  { emoji: '⭐', name: 'ngôi sao' },
  { emoji: '🍎', name: 'quả táo' },
  { emoji: '🌸', name: 'bông hoa' },
  { emoji: '🦋', name: 'con bướm' },
  { emoji: '🐣', name: 'gà con' },
  { emoji: '🍊', name: 'quả cam' },
  { emoji: '🐠', name: 'cá vàng' },
  { emoji: '🐰', name: 'con thỏ' },
  { emoji: '🍌', name: 'chuối' },
  { emoji: '🐻', name: 'con gấu' },
  { emoji: '🍓', name: 'dâu tây' },
];

interface BtnData {
  bg:   Phaser.GameObjects.Rectangle;
  txt:  Phaser.GameObjects.Text;
  n:    number;
  origX: number;
}

export class CountingScene extends Phaser.Scene {
  // ── State ──────────────────────────────────────────────────────────────────
  private score      = 0;
  private round      = 0;
  private gameStartMs = 0;
  private correct = 0;
  private busy    = false;

  // ── UI refs ────────────────────────────────────────────────────────────────
  private scoreText!:    Phaser.GameObjects.Text;
  private questionText!: Phaser.GameObjects.Text;
  private roundText!:    Phaser.GameObjects.Text;
  private fbBg!:         Phaser.GameObjects.Rectangle;
  private fbText!:       Phaser.GameObjects.Text;
  private buttons:       BtnData[] = [];

  // ── Per-round objects ──────────────────────────────────────────────────────
  private objects:     Phaser.GameObjects.Text[] = [];
  private cntLabels:   Phaser.GameObjects.Text[] = [];
  private cntCircles:  Phaser.GameObjects.Arc[]  = [];

  constructor() { super({ key: SCENE_KEYS.COUNTING }); }

  // ─────────────────────────────────────────────────────────────────────────
  create() {
    this.gameStartMs = Date.now();
    this.score = 0;
    this.round = 0;
    this.busy  = false;

    this.drawBackground();
    this.drawHeader();
    this.drawQuestionStrip();
    this.buildFeedbackBanner();
    this.buildButtons();
    this.nextRound();
  }

  // ── Background ─────────────────────────────────────────────────────────────
  private drawBackground() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0d1b3e);
    const gfx = this.add.graphics().setAlpha(0.04);
    for (let i = 0; i < 35; i++) {
      gfx.fillStyle(0xffffff);
      gfx.fillCircle(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        Phaser.Math.Between(1, 3),
      );
    }
  }

  // ── Header (depth 10 so it stays above any overlay) ───────────────────────
  private drawHeader() {
    this.add.rectangle(GAME_WIDTH / 2, HEADER_H / 2, GAME_WIDTH, HEADER_H, 0x0a1628).setDepth(10);

    const back = this.add.text(14, 13, '⬅ Home', {
      fontSize: '14px', color: '#aaaacc', fontFamily: 'Arial',
    }).setDepth(10).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#ffffff'));
    back.on('pointerout',  () => back.setColor('#aaaacc'));
    back.on('pointerdown', () => this.goToMenu());

    this.add.text(GAME_WIDTH / 2, 13, '🔢 Học Đếm Số', {
      fontSize: '17px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(10);

    this.scoreText = this.add.text(GAME_WIDTH - 14, 13, '⭐ 0', {
      fontSize: '16px', color: '#f1c40f', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(1, 0).setDepth(10);
  }

  // ── Question strip ─────────────────────────────────────────────────────────
  private drawQuestionStrip() {
    this.add.rectangle(GAME_WIDTH / 2, HEADER_H + QUESTION_H / 2, GAME_WIDTH, QUESTION_H, 0x0f2040);

    this.questionText = this.add.text(GAME_WIDTH / 2, HEADER_H + 14, '', {
      fontSize: '24px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.roundText = this.add.text(GAME_WIDTH / 2, HEADER_H + 50, '', {
      fontSize: '13px', color: '#8899bb', fontFamily: 'Arial',
    }).setOrigin(0.5, 0);
  }

  // ── Feedback banner (between objects and buttons) ──────────────────────────
  private buildFeedbackBanner() {
    this.fbBg = this.add.rectangle(GAME_WIDTH / 2, FB_Y, GAME_WIDTH - 40, 36, 0x000000, 0.75)
      .setDepth(14).setAlpha(0).setVisible(false);

    this.fbText = this.add.text(GAME_WIDTH / 2, FB_Y, '', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(15).setAlpha(0);
  }

  // ── Number buttons 1–10 ────────────────────────────────────────────────────
  private buildButtons() {
    this.buttons = [];
    const startX = (GAME_WIDTH - (5 * BTN_W + 4 * BTN_GAP)) / 2;

    for (let n = 1; n <= MAX_COUNT; n++) {
      const col = (n - 1) % 5;
      const row = Math.floor((n - 1) / 5);
      const cx  = startX + col * (BTN_W + BTN_GAP) + BTN_W / 2;
      const cy  = BTN_TOP + row * BTN_ROW_H + BTN_H / 2;

      const bg = this.add.rectangle(cx, cy, BTN_W, BTN_H, 0x1a3a60)
        .setStrokeStyle(2, 0x3a6a9a)
        .setInteractive({ useHandCursor: true });

      const txt = this.add.text(cx, cy, String(n), {
        fontSize: '30px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5);

      bg.on('pointerover',  () => { if (!this.busy) bg.setFillStyle(0x2a4a70); });
      bg.on('pointerout',   () => { if (!this.busy) this.resetBtnStyle(bg); });
      bg.on('pointerdown',  () => this.handleAnswer(n));

      this.buttons.push({ bg, txt, n, origX: cx });
    }
  }

  private resetBtnStyle(bg: Phaser.GameObjects.Rectangle) {
    bg.setFillStyle(0x1a3a60);
    bg.setStrokeStyle(2, 0x3a6a9a);
  }

  // ── Spawn objects ──────────────────────────────────────────────────────────
  private spawnObjects(count: number, emoji: string) {
    this.clearObjects();

    // Grid: up to 5 per row
    const cols     = Math.min(count, 5);
    const rows     = Math.ceil(count / cols);
    const areaH    = OBJ_BOT - OBJ_TOP;
    const areaW    = GAME_WIDTH - 20;
    const cellSize = Math.floor(Math.min(areaW / cols, areaH / rows, 100));
    const fontSize = Math.max(28, cellSize - 16);
    const gridW    = cols * cellSize;
    const gridH    = rows * cellSize;
    const startX   = (GAME_WIDTH - gridW) / 2 + cellSize / 2;
    const startY   = OBJ_TOP + (areaH - gridH) / 2 + cellSize / 2;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x   = startX + col * cellSize;
      const y   = startY + row * cellSize;

      const obj = this.add.text(x, y, emoji, {
        fontSize: `${fontSize}px`,
      }).setOrigin(0.5).setAlpha(0);

      // Staggered pop-in entrance
      this.tweens.add({
        targets:  obj,
        alpha:    1,
        scaleX:   { from: 0.2, to: 1 },
        scaleY:   { from: 0.2, to: 1 },
        ease:     'Back.easeOut',
        duration: 320,
        delay:    i * 70,
      });

      this.objects.push(obj);
    }
  }

  private clearObjects() {
    this.objects.forEach(o => o.destroy());
    this.cntLabels.forEach(l => l.destroy());
    this.cntCircles.forEach(c => c.destroy());
    this.objects    = [];
    this.cntLabels  = [];
    this.cntCircles = [];
  }

  // ── Answer handling ────────────────────────────────────────────────────────
  private handleAnswer(n: number) {
    if (this.busy) return;
    this.busy = true;
    this.setButtonsEnabled(false);

    const btn = this.buttons.find(b => b.n === n)!;
    n === this.correct ? this.onCorrect(btn) : this.onWrong(btn);
  }

  // ── Correct ────────────────────────────────────────────────────────────────
  private onCorrect(btn: BtnData) {
    const pts = 10;
    this.score += pts;
    this.scoreText.setText(`⭐ ${this.score}`);

    btn.bg.setFillStyle(0x27ae60).setStrokeStyle(3, 0x2ecc71);

    // Count-through animation → then celebrate
    this.animateCounting(() => {
      this.showFeedback(`✓ Đúng rồi!  +${pts} điểm`, '#2ecc71');
      this.bounceAllObjects();
      this.time.delayedCall(1800, () => {
        this.resetBtnStyle(btn.bg);
        btn.bg.x = btn.origX;
        this.hideFeedback(() => this.nextRound());
      });
    });
  }

  // ── Wrong ──────────────────────────────────────────────────────────────────
  private onWrong(btn: BtnData) {
    btn.bg.setFillStyle(0xc0392b).setStrokeStyle(3, 0xe74c3c);

    // Shake button bg + label together
    [btn.bg, btn.txt].forEach(obj => {
      const ox = (obj as Phaser.GameObjects.Components.Transform).x;
      this.tweens.add({
        targets:  obj,
        x:        { from: ox - 9, to: ox + 9 },
        ease:     'Sine.inOut',
        duration: 75,
        repeat:   4,
        yoyo:     true,
        onComplete: () => {
          (obj as Phaser.GameObjects.Components.Transform).x = ox;
          this.resetBtnStyle(btn.bg);
        },
      });
    });

    // Objects jiggle
    this.objects.forEach(obj => {
      this.tweens.add({
        targets:  obj,
        x:        { from: obj.x - 6, to: obj.x + 6 },
        ease:     'Sine.inOut',
        duration: 70,
        repeat:   3,
        yoyo:     true,
      });
    });

    this.showFeedback('Hãy đếm kỹ lại nhé! 🔍', '#e67e22');

    this.time.delayedCall(1300, () => {
      this.hideFeedback();
      this.setButtonsEnabled(true);
      this.busy = false;
    });
  }

  // ── Counting animation ─────────────────────────────────────────────────────
  // Highlights each object sequentially, shows its ordinal number above it.
  private animateCounting(onDone: () => void) {
    const STEP = 270;   // ms per object

    this.objects.forEach((obj, idx) => {
      this.time.delayedCall(idx * STEP, () => {
        // Glow circle behind the object
        const glow = this.add.circle(obj.x, obj.y, 34, 0xf1c40f, 0.25).setDepth(3);
        this.cntCircles.push(glow);
        this.tweens.add({
          targets: glow, scaleX: 1.5, scaleY: 1.5, alpha: 0,
          duration: STEP * 0.9, ease: 'Quad.easeOut',
        });

        // Pop scale
        this.tweens.add({
          targets:  obj,
          scaleX:   { from: 1, to: 1.5 },
          scaleY:   { from: 1, to: 1.5 },
          ease:     'Cubic.easeOut',
          duration: 120,
          yoyo:     true,
        });

        // Count label (1, 2, 3…)
        const lbl = this.add.text(obj.x, obj.y - 46, String(idx + 1), {
          fontSize: '20px', color: '#f1c40f', fontFamily: 'Arial', fontStyle: 'bold',
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5).setAlpha(0).setDepth(5);
        this.cntLabels.push(lbl);

        this.tweens.add({
          targets:  lbl,
          alpha:    1,
          y:        lbl.y - 10,
          ease:     'Cubic.easeOut',
          duration: 180,
        });

        // Last object: trigger onDone after it finishes
        if (idx === this.objects.length - 1) {
          this.time.delayedCall(STEP, onDone);
        }
      });
    });
  }

  // ── Bounce all objects (celebration) ──────────────────────────────────────
  private bounceAllObjects() {
    this.objects.forEach((obj, i) => {
      this.tweens.add({
        targets:  obj,
        y:        obj.y - 22,
        ease:     'Cubic.easeOut',
        duration: 220,
        delay:    i * 35,
        yoyo:     true,
        repeat:   1,
      });
    });
  }

  // ── Feedback banner ────────────────────────────────────────────────────────
  private showFeedback(msg: string, color: string) {
    this.fbBg.setVisible(true).setAlpha(0);
    this.fbText.setText(msg).setColor(color).setAlpha(0);
    this.tweens.add({ targets: [this.fbBg, this.fbText], alpha: 1, duration: 200 });
  }

  private hideFeedback(onDone?: () => void) {
    this.tweens.add({
      targets:    [this.fbBg, this.fbText],
      alpha:      0,
      duration:   200,
      onComplete: () => { this.fbBg.setVisible(false); onDone?.(); },
    });
  }

  // ── Button helpers ─────────────────────────────────────────────────────────
  private setButtonsEnabled(on: boolean) {
    this.buttons.forEach(b =>
      on ? b.bg.setInteractive({ useHandCursor: true }) : b.bg.disableInteractive(),
    );
  }

  // ── Next round ─────────────────────────────────────────────────────────────
  private nextRound() {
    this.round++;
    if (this.round > ROUNDS) { this.showEndScreen(); return; }

    this.busy = false;
    this.setButtonsEnabled(true);
    this.buttons.forEach(b => {
      this.resetBtnStyle(b.bg);
      b.bg.x  = b.origX;
      b.txt.x = b.origX;
    });

    // Random count + random object type
    this.correct = Phaser.Math.Between(1, MAX_COUNT);
    const type   = OBJECT_TYPES[Phaser.Math.Between(0, OBJECT_TYPES.length - 1)];

    this.questionText.setText(`Có bao nhiêu ${type.emoji}?`);
    this.roundText.setText(`${type.name}  ·  Câu ${this.round} / ${ROUNDS}`);
    this.spawnObjects(this.correct, type.emoji);
  }

  // ── End screen ─────────────────────────────────────────────────────────────
  private showEndScreen() {
    this.setButtonsEnabled(false);

    const ov = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72).setDepth(20);
    const panel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(21);

    const bg = this.add.rectangle(0, 0, 350, 390, 0x0d2244).setStrokeStyle(3, 0x3a6a9a);

    const pct   = Math.round((this.score / (ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? '⭐⭐⭐' : pct >= 60 ? '⭐⭐' : '⭐';
    const starCount: 1 | 2 | 3 = pct >= 90 ? 3 : pct >= 60 ? 2 : 1;
    GlobalProgressState.getInstance().recordPlay(
      SCENE_KEYS.COUNTING, starCount, Date.now() - this.gameStartMs,
    );

    const trophy  = this.add.text(0, -158, '🏆', { fontSize: '56px' }).setOrigin(0.5);
    const title   = this.add.text(0, -96, 'Hoàn thành rồi!', {
      fontSize: '24px', color: '#f1c40f', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    const starTxt = this.add.text(0, -48, stars, { fontSize: '38px' }).setOrigin(0.5);
    const scoreTxt = this.add.text(0, 14, `Điểm: ${this.score} / ${ROUNDS * 10}  (${pct}%)`, {
      fontSize: '18px', color: '#ccddff', fontFamily: 'Arial',
    }).setOrigin(0.5);
    const msgTxt  = this.add.text(0, 54,
      pct >= 90 ? 'Xuất sắc! Bạn đếm rất giỏi! 🎉' :
      pct >= 60 ? 'Tốt lắm! Hãy tiếp tục luyện! 💪' :
                  'Cố gắng hơn lần sau nhé! 🌟', {
      fontSize: '14px', color: '#aabbcc', fontFamily: 'Arial',
    }).setOrigin(0.5);

    const mkBtn = (label: string, color: number, cy: number, action: () => void) => {
      const b = this.add.rectangle(0, cy, 220, 52, color).setStrokeStyle(2, 0x5a8aba);
      const t = this.add.text(0, cy, label, {
        fontSize: '17px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5);
      b.setInteractive({ useHandCursor: true });
      b.on('pointerover', () => b.setAlpha(0.85));
      b.on('pointerout',  () => b.setAlpha(1));
      b.on('pointerdown', action);
      return [b, t];
    };

    const [agBg, agT]   = mkBtn('🔄 Chơi lại',    0x27ae60, 116, () => this.scene.restart());
    const [mnBg, mnT]   = mkBtn('🏠 Trang chủ',   0x2c3e50, 176, () => this.goToMenu());

    panel.add([bg, trophy, title, starTxt, scoreTxt, msgTxt, agBg, agT, mnBg, mnT]);
    void ov; // ov is on scene, not in panel

    // Pop-in entrance
    panel.setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: panel, scaleX: 1, scaleY: 1, alpha: 1, ease: 'Back.easeOut', duration: 380 });
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  private goToMenu() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(SCENE_KEYS.WORLD_MAP));
  }
}
