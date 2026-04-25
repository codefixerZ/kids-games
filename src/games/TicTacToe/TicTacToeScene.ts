import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS } from '../../config';

// ── Layout ────────────────────────────────────────────────────────────────────
const HEADER_H  = 45;
const BOARD_SIZE = 390;              // board is 390×390
const CELL      = BOARD_SIZE / 3;   // 130×130 per cell
const BOARD_X   = (GAME_WIDTH - BOARD_SIZE) / 2;
const BOARD_Y   = HEADER_H + 70;

type Mark = 'X' | 'O' | null;
type Difficulty = 'easy' | 'hard';

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],   // rows
  [0,3,6],[1,4,7],[2,5,8],   // cols
  [0,4,8],[2,4,6],           // diags
];

export class TicTacToeScene extends Phaser.Scene {
  private board: Mark[]      = Array(9).fill(null);
  private playerMark: Mark   = 'X';
  private aiMark: Mark       = 'O';
  private difficulty: Difficulty = 'hard';
  private playerScore        = 0;
  private aiScore            = 0;
  private draws              = 0;
  private busy               = false;

  private cellBgs:  Phaser.GameObjects.Rectangle[] = [];
  private markTexts: Phaser.GameObjects.Text[]     = [];
  private statusText!: Phaser.GameObjects.Text;
  private scoreText!:  Phaser.GameObjects.Text;
  private winLine!:    Phaser.GameObjects.Graphics;

  constructor() { super({ key: SCENE_KEYS.TIC_TAC_TOE }); }

  create() {
    this.board       = Array(9).fill(null);
    this.busy        = false;
    this.drawBackground();
    this.drawHeader();
    this.drawScoreboard();
    this.drawStatusArea();
    this.drawBoard();
    this.drawDifficultyBar();
    this.setStatus(`Lượt của bạn  ✖`);
  }

  // ── Background ─────────────────────────────────────────────────────────────
  private drawBackground() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0d1b2a);
    const g = this.add.graphics().setAlpha(0.05);
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

    this.add.text(GAME_WIDTH / 2, 13, '✖⭕ X O Fun', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(10);
  }

  // ── Scoreboard ──────────────────────────────────────────────────────────────
  private drawScoreboard() {
    const y = HEADER_H + 20;
    this.add.rectangle(GAME_WIDTH / 2, y + 24, GAME_WIDTH - 20, 52, 0x0f2040)
      .setStrokeStyle(1, 0x2a4060).setOrigin(0.5, 0);

    this.add.text(GAME_WIDTH / 2 - 110, y + 10, '✖ Bạn', {
      fontSize: '13px', color: '#e74c3c', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.add.text(GAME_WIDTH / 2, y + 10, 'Hòa', {
      fontSize: '13px', color: '#95a5a6', fontFamily: 'Arial',
    }).setOrigin(0.5, 0);

    this.add.text(GAME_WIDTH / 2 + 110, y + 10, '⭕ AI', {
      fontSize: '13px', color: '#3498db', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.scoreText = this.add.text(GAME_WIDTH / 2, y + 30, '0 - 0 - 0', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
  }

  private refreshScore() {
    this.scoreText.setText(`${this.playerScore} — ${this.draws} — ${this.aiScore}`);
  }

  // ── Status area ──────────────────────────────────────────────────────────────
  private drawStatusArea() {
    const y = BOARD_Y + BOARD_SIZE + 20;
    this.statusText = this.add.text(GAME_WIDTH / 2, y, '', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5, 0);
  }

  private setStatus(msg: string) {
    this.statusText.setText(msg);
    this.tweens.add({ targets: this.statusText, alpha: { from: 0.3, to: 1 }, duration: 250 });
  }

  // ── Board ────────────────────────────────────────────────────────────────────
  private drawBoard() {
    this.winLine = this.add.graphics();

    const grid = this.add.graphics();
    grid.lineStyle(3, 0x2a4a7a, 1);
    // vertical
    grid.lineBetween(BOARD_X + CELL,   BOARD_Y, BOARD_X + CELL,   BOARD_Y + BOARD_SIZE);
    grid.lineBetween(BOARD_X + CELL*2, BOARD_Y, BOARD_X + CELL*2, BOARD_Y + BOARD_SIZE);
    // horizontal
    grid.lineBetween(BOARD_X, BOARD_Y + CELL,   BOARD_X + BOARD_SIZE, BOARD_Y + CELL);
    grid.lineBetween(BOARD_X, BOARD_Y + CELL*2, BOARD_X + BOARD_SIZE, BOARD_Y + CELL*2);

    this.cellBgs   = [];
    this.markTexts = [];

    for (let i = 0; i < 9; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx  = BOARD_X + col * CELL + CELL / 2;
      const cy  = BOARD_Y + row * CELL + CELL / 2;

      const bg = this.add.rectangle(cx, cy, CELL - 6, CELL - 6, 0x0d1f35)
        .setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => { if (!this.board[i] && !this.busy) bg.setFillStyle(0x162848); });
      bg.on('pointerout',  () => { if (!this.board[i] && !this.busy) bg.setFillStyle(0x0d1f35); });
      bg.on('pointerdown', () => this.playerMove(i));

      const mark = this.add.text(cx, cy, '', {
        fontSize: '76px', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5);

      this.cellBgs.push(bg);
      this.markTexts.push(mark);
    }
  }

  // ── Difficulty bar ────────────────────────────────────────────────────────
  private drawDifficultyBar() {
    const y = BOARD_Y + BOARD_SIZE + 70;
    this.add.text(GAME_WIDTH / 2, y, 'Độ khó:', {
      fontSize: '13px', color: '#8899bb', fontFamily: 'Arial',
    }).setOrigin(0.5, 0);

    const mkBtn = (label: string, diff: Difficulty, bx: number) => {
      const isCur = () => this.difficulty === diff;
      const bg = this.add.rectangle(bx, y + 38, 100, 34, isCur() ? 0x27ae60 : 0x162040)
        .setStrokeStyle(1, 0x3a5a8a).setInteractive({ useHandCursor: true });
      const txt = this.add.text(bx, y + 38, label, {
        fontSize: '13px', color: '#fff', fontFamily: 'Arial',
      }).setOrigin(0.5);
      bg.on('pointerdown', () => {
        this.difficulty = diff;
        easyBg.setFillStyle(this.difficulty === 'easy' ? 0x27ae60 : 0x162040);
        hardBg.setFillStyle(this.difficulty === 'hard' ? 0x27ae60 : 0x162040);
      });
      return bg;
    };
    const easyBg = mkBtn('😊 Dễ',   'easy', GAME_WIDTH / 2 - 60);
    const hardBg = mkBtn('🤖 Khó',   'hard', GAME_WIDTH / 2 + 60);

    // New game button
    const ny = y + 88;
    const newBg = this.add.rectangle(GAME_WIDTH / 2, ny, 200, 40, 0x2980b9)
      .setStrokeStyle(1, 0x5ab0e0).setInteractive({ useHandCursor: true });
    newBg.on('pointerover', () => newBg.setAlpha(0.8));
    newBg.on('pointerout',  () => newBg.setAlpha(1));
    newBg.on('pointerdown', () => this.resetBoard());
    this.add.text(GAME_WIDTH / 2, ny, '🔄 Ván mới', {
      fontSize: '15px', color: '#fff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  // ── Game logic ────────────────────────────────────────────────────────────
  private playerMove(idx: number) {
    if (this.busy || this.board[idx]) return;
    this.placeMark(idx, this.playerMark!);
    const result = this.checkResult();
    if (result) { this.handleResult(result); return; }
    this.busy = true;
    this.setStatus('AI đang suy nghĩ…');
    this.time.delayedCall(480, () => this.aiMove());
  }

  private aiMove() {
    const idx = this.difficulty === 'hard' ? this.minimax_move() : this.randomMove();
    this.placeMark(idx, this.aiMark!);
    this.busy = false;
    const result = this.checkResult();
    if (result) { this.handleResult(result); return; }
    this.setStatus(`Lượt của bạn  ✖`);
  }

  private placeMark(idx: number, mark: Mark) {
    this.board[idx] = mark;
    const txt  = this.markTexts[idx];
    const isX  = mark === 'X';
    txt.setText(isX ? '✖' : '⭕');
    txt.setColor(isX ? '#e74c3c' : '#3498db');
    txt.setScale(0.3).setAlpha(0);
    this.tweens.add({ targets: txt, scaleX: 1, scaleY: 1, alpha: 1, ease: 'Back.easeOut', duration: 200 });
    this.cellBgs[idx].disableInteractive();
  }

  private checkResult(): 'player' | 'ai' | 'draw' | null {
    for (const [a, b, c] of WIN_LINES) {
      if (this.board[a] && this.board[a] === this.board[b] && this.board[b] === this.board[c]) {
        this.drawWinLine(a, c);
        return this.board[a] === this.playerMark ? 'player' : 'ai';
      }
    }
    if (this.board.every(v => v !== null)) return 'draw';
    return null;
  }

  private drawWinLine(from: number, to: number) {
    const pos = (i: number) => ({
      x: BOARD_X + (i % 3) * CELL + CELL / 2,
      y: BOARD_Y + Math.floor(i / 3) * CELL + CELL / 2,
    });
    const a = pos(from);
    const b = pos(to);
    this.winLine.lineStyle(6, 0xf1c40f, 1);
    this.winLine.beginPath();
    this.winLine.moveTo(a.x, a.y);
    this.winLine.lineTo(b.x, b.y);
    this.winLine.strokePath();
  }

  private handleResult(result: 'player' | 'ai' | 'draw') {
    this.busy = true;
    if (result === 'player') {
      this.playerScore++;
      this.setStatus('🎉 Bạn thắng!');
    } else if (result === 'ai') {
      this.aiScore++;
      this.setStatus('🤖 AI thắng!');
    } else {
      this.draws++;
      this.setStatus('🤝 Hòa!');
    }
    this.refreshScore();
    // pulse the board
    this.tweens.add({ targets: [...this.markTexts], scaleX: 1.15, scaleY: 1.15, ease: 'Cubic.easeOut', duration: 200, yoyo: true });
    this.time.delayedCall(1400, () => this.resetBoard());
  }

  private resetBoard() {
    this.board = Array(9).fill(null);
    this.busy  = false;
    this.winLine.clear();
    for (let i = 0; i < 9; i++) {
      this.markTexts[i].setText('');
      this.cellBgs[i].setFillStyle(0x0d1f35);
      this.cellBgs[i].setInteractive({ useHandCursor: true });
    }
    this.setStatus(`Lượt của bạn  ✖`);
  }

  // ── Minimax AI ────────────────────────────────────────────────────────────
  private minimax_move(): number {
    let best = -Infinity, move = -1;
    for (let i = 0; i < 9; i++) {
      if (!this.board[i]) {
        this.board[i] = this.aiMark;
        const score = this.minimax(this.board, 0, false);
        this.board[i] = null;
        if (score > best) { best = score; move = i; }
      }
    }
    return move;
  }

  private minimax(b: Mark[], depth: number, isMax: boolean): number {
    const w = this.winnerOf(b);
    if (w === this.aiMark)     return 10 - depth;
    if (w === this.playerMark) return depth - 10;
    if (b.every(v => v))       return 0;

    if (isMax) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!b[i]) { b[i] = this.aiMark; best = Math.max(best, this.minimax(b, depth+1, false)); b[i] = null; }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!b[i]) { b[i] = this.playerMark; best = Math.min(best, this.minimax(b, depth+1, true)); b[i] = null; }
      }
      return best;
    }
  }

  private winnerOf(b: Mark[]): Mark {
    for (const [a, bIdx, c] of WIN_LINES) {
      if (b[a] && b[a] === b[bIdx] && b[bIdx] === b[c]) return b[a];
    }
    return null;
  }

  private randomMove(): number {
    const empty = this.board.map((v, i) => v ? -1 : i).filter(i => i >= 0);
    return empty[Phaser.Math.Between(0, empty.length - 1)];
  }

  private goToMenu() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(SCENE_KEYS.MENU));
  }
}
