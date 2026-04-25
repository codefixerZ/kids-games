import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS } from '../../config';
import { GlobalProgressState } from '../../state/GlobalProgressState';

// ── Grid config ───────────────────────────────────────────────────────────────
const GS       = 6;            // 6×6 grid = 36 cells
const WIN_LEN  = 4;            // 4 in a row to win
const TOTAL    = GS * GS;      // 36

// ── Layout ────────────────────────────────────────────────────────────────────
const HEADER_H  = 45;
const BOARD_SIZE = 420;        // 420/6 = 70px per cell
const CELL      = BOARD_SIZE / GS;
const BOARD_X   = (GAME_WIDTH - BOARD_SIZE) / 2;   // 30
const BOARD_Y   = HEADER_H + 70;                   // 115

// ── Generate all win lines (4-in-a-row) ───────────────────────────────────────
const WIN_LINES: number[][] = [];
for (let r = 0; r < GS; r++) {
  for (let c = 0; c < GS; c++) {
    const i = r * GS + c;
    // horizontal →
    if (c + WIN_LEN <= GS) {
      WIN_LINES.push(Array.from({ length: WIN_LEN }, (_, k) => i + k));
    }
    // vertical ↓
    if (r + WIN_LEN <= GS) {
      WIN_LINES.push(Array.from({ length: WIN_LEN }, (_, k) => i + k * GS));
    }
    // diagonal ↘
    if (r + WIN_LEN <= GS && c + WIN_LEN <= GS) {
      WIN_LINES.push(Array.from({ length: WIN_LEN }, (_, k) => i + k * GS + k));
    }
    // diagonal ↗
    if (r + WIN_LEN <= GS && c - WIN_LEN + 1 >= 0) {
      WIN_LINES.push(Array.from({ length: WIN_LEN }, (_, k) => i + k * GS - k));
    }
  }
}

// Pre-build a lookup: cell → list of WIN_LINE indices that contain it
const CELL_LINES: number[][] = Array.from({ length: TOTAL }, () => []);
WIN_LINES.forEach((line, li) => line.forEach(cell => CELL_LINES[cell].push(li)));

type Mark = 'X' | 'O' | null;
type Difficulty = 'easy' | 'hard';

export class TicTacToeScene extends Phaser.Scene {
  private board: Mark[]       = Array(TOTAL).fill(null);
  private playerMark: Mark    = 'X';
  private aiMark: Mark        = 'O';
  private difficulty: Difficulty = 'hard';
  private playerScore         = 0;
  private aiScore             = 0;
  private draws               = 0;
  private busy                = false;
  private winLineIdx          = -1;   // index into WIN_LINES of the winning line

  private cellBgs:   Phaser.GameObjects.Rectangle[] = [];
  private markTexts: Phaser.GameObjects.Text[]      = [];
  private statusText!: Phaser.GameObjects.Text;
  private scoreText!:  Phaser.GameObjects.Text;
  private winGfx!:     Phaser.GameObjects.Graphics;
  private easyBg!:     Phaser.GameObjects.Rectangle;
  private hardBg!:     Phaser.GameObjects.Rectangle;

  constructor() { super({ key: SCENE_KEYS.TIC_TAC_TOE }); }

  create() {
    this.board   = Array(TOTAL).fill(null);
    this.busy    = false;
    this.winLineIdx = -1;
    this.drawBackground();
    this.drawHeader();
    this.drawScoreboard();
    this.drawBoard();
    this.drawStatusArea();
    this.drawControls();
    this.setStatus('Lượt của bạn  ✖');
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
    this.add.text(GAME_WIDTH / 2, 13, '✖⭕ X O Fun — 4 liên', {
      fontSize: '15px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(10);
  }

  // ── Scoreboard ─────────────────────────────────────────────────────────────
  private drawScoreboard() {
    const y = HEADER_H + 14;
    this.add.rectangle(GAME_WIDTH / 2, y + 20, GAME_WIDTH - 20, 44, 0x0f2040)
      .setStrokeStyle(1, 0x2a4060).setOrigin(0.5, 0);
    this.add.text(GAME_WIDTH / 2 - 110, y + 8, '✖ Bạn', {
      fontSize: '12px', color: '#e74c3c', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.add.text(GAME_WIDTH / 2, y + 8, 'Hòa', {
      fontSize: '12px', color: '#95a5a6', fontFamily: 'Arial',
    }).setOrigin(0.5, 0);
    this.add.text(GAME_WIDTH / 2 + 110, y + 8, '⭕ AI', {
      fontSize: '12px', color: '#3498db', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.scoreText = this.add.text(GAME_WIDTH / 2, y + 26, '0 — 0 — 0', {
      fontSize: '17px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
  }

  private refreshScore() {
    this.scoreText.setText(`${this.playerScore} — ${this.draws} — ${this.aiScore}`);
  }

  // ── 6×6 board ───────────────────────────────────────────────────────────────
  private drawBoard() {
    this.winGfx = this.add.graphics();

    // Grid lines
    const g = this.add.graphics();
    g.lineStyle(1.5, 0x2a4a7a, 1);
    for (let k = 1; k < GS; k++) {
      g.lineBetween(BOARD_X + k * CELL, BOARD_Y, BOARD_X + k * CELL, BOARD_Y + BOARD_SIZE);
      g.lineBetween(BOARD_X, BOARD_Y + k * CELL, BOARD_X + BOARD_SIZE, BOARD_Y + k * CELL);
    }
    // Outer border
    g.lineStyle(2, 0x3a5a8a, 1);
    g.strokeRect(BOARD_X, BOARD_Y, BOARD_SIZE, BOARD_SIZE);

    this.cellBgs   = [];
    this.markTexts = [];

    for (let i = 0; i < TOTAL; i++) {
      const col = i % GS;
      const row = Math.floor(i / GS);
      const cx  = BOARD_X + col * CELL + CELL / 2;
      const cy  = BOARD_Y + row * CELL + CELL / 2;

      const bg = this.add.rectangle(cx, cy, CELL - 2, CELL - 2, 0x0d1f35)
        .setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => { if (!this.board[i] && !this.busy) bg.setFillStyle(0x162848); });
      bg.on('pointerout',  () => { if (!this.board[i] && !this.busy) bg.setFillStyle(0x0d1f35); });
      bg.on('pointerdown', () => this.playerMove(i));

      const mark = this.add.text(cx, cy, '', {
        fontSize: '38px', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5);

      this.cellBgs.push(bg);
      this.markTexts.push(mark);
    }
  }

  // ── Status + controls ────────────────────────────────────────────────────
  private drawStatusArea() {
    const y = BOARD_Y + BOARD_SIZE + 12;
    this.statusText = this.add.text(GAME_WIDTH / 2, y, '', {
      fontSize: '17px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
  }

  private setStatus(msg: string) {
    this.statusText.setText(msg);
    this.tweens.add({ targets: this.statusText, alpha: { from: 0.4, to: 1 }, duration: 220 });
  }

  private drawControls() {
    const y = BOARD_Y + BOARD_SIZE + 52;

    // Difficulty label + buttons
    this.add.text(GAME_WIDTH / 2, y, 'Độ khó:', {
      fontSize: '12px', color: '#8899bb', fontFamily: 'Arial',
    }).setOrigin(0.5, 0);

    const mkDiff = (label: string, diff: Difficulty, bx: number) => {
      const active = diff === this.difficulty;
      const bg = this.add.rectangle(bx, y + 34, 96, 30, active ? 0x27ae60 : 0x162040)
        .setStrokeStyle(1, 0x3a5a8a).setInteractive({ useHandCursor: true });
      this.add.text(bx, y + 34, label, {
        fontSize: '12px', color: '#fff', fontFamily: 'Arial',
      }).setOrigin(0.5);
      bg.on('pointerdown', () => {
        this.difficulty = diff;
        this.easyBg.setFillStyle(this.difficulty === 'easy' ? 0x27ae60 : 0x162040);
        this.hardBg.setFillStyle(this.difficulty === 'hard' ? 0x27ae60 : 0x162040);
      });
      return bg;
    };
    this.easyBg = mkDiff('😊 Dễ',  'easy', GAME_WIDTH / 2 - 58);
    this.hardBg = mkDiff('🤖 Khó', 'hard', GAME_WIDTH / 2 + 58);

    // New game button
    const ny = y + 76;
    const nb = this.add.rectangle(GAME_WIDTH / 2, ny, 200, 38, 0x2980b9)
      .setStrokeStyle(1, 0x5ab0e0).setInteractive({ useHandCursor: true });
    nb.on('pointerover', () => nb.setAlpha(0.8));
    nb.on('pointerout',  () => nb.setAlpha(1));
    nb.on('pointerdown', () => this.resetBoard());
    this.add.text(GAME_WIDTH / 2, ny, '🔄 Ván mới', {
      fontSize: '14px', color: '#fff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  // ── Player move ────────────────────────────────────────────────────────────
  private playerMove(idx: number) {
    if (this.busy || this.board[idx]) return;
    this.placeMark(idx, this.playerMark!);
    const result = this.checkResult();
    if (result) { this.handleResult(result); return; }
    this.busy = true;
    this.setStatus('AI đang suy nghĩ…');
    this.time.delayedCall(300, () => this.aiMove());
  }

  private aiMove() {
    const idx = this.difficulty === 'hard' ? this.heuristicMove() : this.randomMove();
    this.placeMark(idx, this.aiMark!);
    this.busy = false;
    const result = this.checkResult();
    if (result) { this.handleResult(result); return; }
    this.setStatus('Lượt của bạn  ✖');
  }

  private placeMark(idx: number, mark: Mark) {
    this.board[idx] = mark;
    const txt = this.markTexts[idx];
    const isX = mark === 'X';
    txt.setText(isX ? '✖' : '⭕');
    txt.setColor(isX ? '#e74c3c' : '#3498db');
    txt.setScale(0.2).setAlpha(0);
    this.tweens.add({ targets: txt, scaleX: 1, scaleY: 1, alpha: 1, ease: 'Back.easeOut', duration: 160 });
    this.cellBgs[idx].disableInteractive();
  }

  // ── Check result ───────────────────────────────────────────────────────────
  private checkResult(): 'player' | 'ai' | 'draw' | null {
    for (let li = 0; li < WIN_LINES.length; li++) {
      const line = WIN_LINES[li];
      const first = this.board[line[0]];
      if (first && line.every(i => this.board[i] === first)) {
        this.winLineIdx = li;
        this.highlightWinLine(line);
        return first === this.playerMark ? 'player' : 'ai';
      }
    }
    if (this.board.every(v => v !== null)) return 'draw';
    return null;
  }

  private highlightWinLine(line: number[]) {
    const pos = (i: number) => ({
      x: BOARD_X + (i % GS) * CELL + CELL / 2,
      y: BOARD_Y + Math.floor(i / GS) * CELL + CELL / 2,
    });
    const a = pos(line[0]);
    const b = pos(line[WIN_LEN - 1]);
    this.winGfx.lineStyle(5, 0xf1c40f, 1);
    this.winGfx.beginPath();
    this.winGfx.moveTo(a.x, a.y);
    this.winGfx.lineTo(b.x, b.y);
    this.winGfx.strokePath();
    // Also highlight the winning cells
    line.forEach(i => {
      this.cellBgs[i].setFillStyle(0x1a3a10);
      this.cellBgs[i].setStrokeStyle(2, 0xf1c40f);
    });
  }

  private handleResult(result: 'player' | 'ai' | 'draw') {
    this.busy = true;
    if (result === 'player') { this.playerScore++; this.setStatus('🎉 Bạn thắng!'); }
    else if (result === 'ai')  { this.aiScore++;    this.setStatus('🤖 AI thắng!'); }
    else                       { this.draws++;      this.setStatus('🤝 Hòa!'); }
    this.refreshScore();
    const tttStars: 1 | 2 | 3 = result === 'player' ? 3 : result === 'draw' ? 2 : 1;
    GlobalProgressState.getInstance().recordPlay(SCENE_KEYS.TIC_TAC_TOE, tttStars, 0);
    this.time.delayedCall(1600, () => this.resetBoard());
  }

  private resetBoard() {
    this.board = Array(TOTAL).fill(null);
    this.busy  = false;
    this.winLineIdx = -1;
    this.winGfx.clear();
    for (let i = 0; i < TOTAL; i++) {
      this.markTexts[i].setText('');
      this.cellBgs[i].setFillStyle(0x0d1f35).setStrokeStyle(0);
      this.cellBgs[i].setInteractive({ useHandCursor: true });
    }
    this.setStatus('Lượt của bạn  ✖');
  }

  // ── Heuristic AI (fast, works on any board size) ─────────────────────────
  private heuristicMove(): number {
    // 1. Win immediately
    for (let i = 0; i < TOTAL; i++) {
      if (!this.board[i]) {
        this.board[i] = this.aiMark;
        const win = WIN_LINES.some(line => line.every(j => this.board[j] === this.aiMark));
        this.board[i] = null;
        if (win) return i;
      }
    }
    // 2. Block player's immediate win
    for (let i = 0; i < TOTAL; i++) {
      if (!this.board[i]) {
        this.board[i] = this.playerMark;
        const win = WIN_LINES.some(line => line.every(j => this.board[j] === this.playerMark));
        this.board[i] = null;
        if (win) return i;
      }
    }
    // 3. Score-based: threat analysis per cell
    let bestScore = -1, bestIdx = -1;
    for (let i = 0; i < TOTAL; i++) {
      if (this.board[i]) continue;
      const score = this.scoreCell(i);
      if (score > bestScore || (score === bestScore && Math.random() < 0.2)) {
        bestScore = score; bestIdx = i;
      }
    }
    return bestIdx >= 0 ? bestIdx : this.randomMove();
  }

  // Score how valuable placing at cell `idx` is
  private scoreCell(idx: number): number {
    let score = 0;
    // Small center-bias bonus
    const row = Math.floor(idx / GS), col = idx % GS;
    score += (GS / 2 - Math.abs(row - (GS - 1) / 2)) + (GS / 2 - Math.abs(col - (GS - 1) / 2));

    for (const li of CELL_LINES[idx]) {
      const line = WIN_LINES[li];
      let ai = 0, pl = 0;
      for (const j of line) {
        if (this.board[j] === this.aiMark)     ai++;
        else if (this.board[j] === this.playerMark) pl++;
      }
      // Only lines where we can still win are useful
      if (ai > 0 && pl === 0) score += Math.pow(10, ai);          // offensive
      if (pl > 0 && ai === 0) score += Math.pow(10, pl) * 0.9;    // defensive
    }
    return score;
  }

  private randomMove(): number {
    const empty = this.board.reduce<number[]>((acc, v, i) => { if (!v) acc.push(i); return acc; }, []);
    return empty[Phaser.Math.Between(0, empty.length - 1)];
  }

  private goToMenu() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(SCENE_KEYS.WORLD_MAP));
  }
}
