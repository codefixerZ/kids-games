import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS, COLORS } from '../../config';
import { DrawingCanvas } from './DrawingCanvas';
import { ToolBar } from './ToolBar';
import { ScoreManager } from './ScoreManager';
import { VocabDisplay } from './VocabDisplay';
import { AIGuesser } from './AIGuesser';
import { loadWordList } from './wordList';

// Portrait layout constants
const HEADER_H   = 45;
const WORD_Y     = HEADER_H;
const WORD_H     = 90;

const CANVAS_X   = 8;
const CANVAS_Y   = WORD_Y + WORD_H + 5;   // 140
const CANVAS_W   = GAME_WIDTH - 16;        // 464
const CANVAS_H   = 480;

const TOOLBAR_Y  = CANVAS_Y + CANVAS_H + 5; // 625
const TOOLBAR_H  = GAME_HEIGHT - TOOLBAR_Y - 5; // 190

const WORDS_PER_ROUND = 5;

export class DrawGuessScene extends Phaser.Scene {
  private drawingCanvas!: DrawingCanvas;
  private toolBar!: ToolBar;
  private scoreManager!: ScoreManager;
  private vocabDisplay!: VocabDisplay;
  private aiGuesser!: AIGuesser;
  private headerScoreText!: Phaser.GameObjects.Text;
  private guessing = false;

  constructor() {
    super({ key: SCENE_KEYS.DRAW_GUESS });
  }

  create() {
    this.drawBackground();
    this.drawHeader();

    this.drawingCanvas = new DrawingCanvas(this, CANVAS_X, CANVAS_Y, CANVAS_W, CANVAS_H);
    this.toolBar = new ToolBar(this, 0, TOOLBAR_Y, GAME_WIDTH, TOOLBAR_H);
    this.vocabDisplay = new VocabDisplay(this, 0, WORD_Y, GAME_WIDTH, WORD_H, CANVAS_X, CANVAS_Y, CANVAS_W, CANVAS_H);
    this.scoreManager = new ScoreManager(WORDS_PER_ROUND);
    this.aiGuesser = new AIGuesser();

    this.events.once('shutdown', () => {
      this.drawingCanvas?.destroy();
      this.vocabDisplay?.destroy();
    });

    this.wireEvents();

    loadWordList().then(words => {
      this.scoreManager.init(words);
      this.scoreManager.nextWord();
    });
  }

  private drawBackground() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.BG_DARK);
  }

  private drawHeader() {
    const backBtn = this.add.text(14, 14, '⬅ Home', {
      fontSize: '14px', color: '#aaaacc', fontFamily: 'Arial',
    });
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
    backBtn.on('pointerout',  () => backBtn.setColor('#aaaacc'));
    backBtn.on('pointerdown', () => this.goToMenu());

    this.add.text(GAME_WIDTH / 2, 13, '🎨 Vẽ & Đoán', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.headerScoreText = this.add.text(GAME_WIDTH - 14, 13, 'Điểm: 0', {
      fontSize: '16px', color: '#f1c40f', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(1, 0);
  }

  private wireEvents() {
    this.toolBar.on('colorChange', (hex: number) => this.drawingCanvas.setBrushColor(hex));
    this.toolBar.on('sizeChange',  (size: number) => this.drawingCanvas.setBrushSize(size));
    this.toolBar.on('clear',  () => this.drawingCanvas.clearCanvas());
    this.toolBar.on('guess',  () => this.handleGuess());

    this.scoreManager.on('newWord', (word: ReturnType<ScoreManager['getCurrentWord']>) => {
      if (!word) return;
      this.vocabDisplay.showWord(word);
      this.vocabDisplay.showScore(
        this.scoreManager.getScore(),
        this.scoreManager.getWordsCompleted(),
        WORDS_PER_ROUND,
      );
      this.headerScoreText.setText(`Điểm: ${this.scoreManager.getScore()}`);
    });

    this.scoreManager.on('roundEnd', ({ score }: { score: number }) => {
      this.drawingCanvas.hide();
      this.vocabDisplay.showRoundEnd(score);
    });

    this.vocabDisplay.onNextWord   = () => this.advanceWord();
    this.vocabDisplay.onBackToMenu = () => this.goToMenu();

    this.aiGuesser.load().then(() => {
      this.vocabDisplay.showAIReady();
    });
  }

  private async handleGuess() {
    if (this.guessing) return;
    if (!this.aiGuesser.isReady()) return;

    this.guessing = true;
    this.vocabDisplay.showThinking();

    try {
      const canvas = await this.drawingCanvas.snapshotToCanvas();
      const results = await this.aiGuesser.classify(canvas);
      const evalResult = this.scoreManager.evaluate(results);
      this.drawingCanvas.hide(); // reveal the Phaser result overlay underneath
      this.vocabDisplay.showResult(evalResult, this.scoreManager.getScore());
      this.headerScoreText.setText(`Điểm: ${this.scoreManager.getScore()}`);
    } catch (err) {
      console.error('AI classification error:', err);
    } finally {
      this.guessing = false;
    }
  }

  private advanceWord() {
    this.drawingCanvas.show(); // bring back the drawing canvas for the next word
    this.drawingCanvas.clearCanvas();
    this.scoreManager.nextWord();
  }

  private goToMenu() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENE_KEYS.MENU);
    });
  }
}
