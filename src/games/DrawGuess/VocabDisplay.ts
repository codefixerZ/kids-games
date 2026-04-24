import * as Phaser from 'phaser';
import { COLORS } from '../../config';
import { WordEntry } from './wordList';
import type { EvaluateResult } from './ScoreManager';

export class VocabDisplay {
  private scene: Phaser.Scene;

  // Word strip layout
  private stripX: number;
  private stripY: number;
  private stripW: number;
  private stripH: number;

  // Canvas area (for result overlay positioning)
  private canvasX: number;
  private canvasY: number;
  private canvasW: number;
  private canvasH: number;

  private wordImgEl: HTMLImageElement | null = null;

  // Word strip elements
  private emojiText!: Phaser.GameObjects.Text;
  private wordText!: Phaser.GameObjects.Text;
  private viText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private aiStatusText!: Phaser.GameObjects.Text;

  // Result overlay (shown on canvas)
  private resultOverlay!: Phaser.GameObjects.Container;

  onNextWord?: () => void;
  onBackToMenu?: () => void;

  constructor(
    scene: Phaser.Scene,
    stripX: number, stripY: number, stripW: number, stripH: number,
    canvasX: number, canvasY: number, canvasW: number, canvasH: number,
  ) {
    this.scene = scene;
    this.stripX = stripX;
    this.stripY = stripY;
    this.stripW = stripW;
    this.stripH = stripH;
    this.canvasX = canvasX;
    this.canvasY = canvasY;
    this.canvasW = canvasW;
    this.canvasH = canvasH;

    this.buildWordStrip();
    this.buildResultOverlay();
  }

  private buildWordStrip() {
    const { scene, stripX, stripY, stripW, stripH } = this;

    // Background
    scene.add.rectangle(stripX + stripW / 2, stripY + stripH / 2, stripW, stripH, COLORS.BG_CARD)
      .setStrokeStyle(1, 0x333355);

    // "VẼ CÁI NÀY:" label
    scene.add.text(stripX + 12, stripY + 6, 'VẼ CÁI NÀY:', {
      fontSize: '11px', color: '#aaaacc', fontFamily: 'Arial', fontStyle: 'bold',
    });

    // Emoji (left column)
    this.emojiText = scene.add.text(stripX + 46, stripY + stripH / 2, '', {
      fontSize: '46px',
    }).setOrigin(0.5);

    // Word texts (right of emoji)
    const textX = stripX + 84;
    this.wordText = scene.add.text(textX, stripY + 16, '', {
      fontSize: '24px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    });

    this.viText = scene.add.text(textX, stripY + 44, '', {
      fontSize: '13px', color: '#aaaacc', fontFamily: 'Arial',
    });

    this.hintText = scene.add.text(textX, stripY + 62, '', {
      fontSize: '11px', color: '#7799bb', fontFamily: 'Arial',
      wordWrap: { width: stripW - textX - 90 },
    });

    // Score / progress (right side)
    this.scoreText = scene.add.text(stripX + stripW - 12, stripY + 18, 'Điểm: 0', {
      fontSize: '16px', color: '#f1c40f', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(1, 0);

    this.progressText = scene.add.text(stripX + stripW - 12, stripY + 42, '', {
      fontSize: '12px', color: '#aaaacc', fontFamily: 'Arial',
    }).setOrigin(1, 0);

    // AI status (bottom-right of strip)
    this.aiStatusText = scene.add.text(stripX + stripW - 12, stripY + 62, '🤖 AI đang tải...', {
      fontSize: '11px', color: '#888899', fontFamily: 'Arial',
    }).setOrigin(1, 0);
  }

  private buildResultOverlay() {
    // Overlay centered on the canvas area
    const cx = this.canvasX + this.canvasW / 2;
    const cy = this.canvasY + this.canvasH / 2;
    this.resultOverlay = this.scene.add.container(cx, cy);
    this.resultOverlay.setVisible(false);
    this.resultOverlay.setDepth(10);
  }

  showWord(word: WordEntry) {
    this.wordText.setText(word.draw);
    this.viText.setText(word.vi);
    this.hintText.setText(word.hint);
    this.hideResult();

    this.wordImgEl?.remove();
    this.wordImgEl = null;

    if (word.image) {
      this.emojiText.setText('');
      this.showWordImage(`/assets/words/${word.image}`);
    } else {
      this.emojiText.setText(word.emoji);
    }
  }

  private showWordImage(src: string) {
    const img = document.createElement('img');
    img.src = src;
    img.style.position = 'absolute';
    img.style.objectFit = 'contain';
    img.style.borderRadius = '6px';
    img.style.pointerEvents = 'none';
    document.body.appendChild(img);
    this.wordImgEl = img;
    this.positionWordImage();
    const onResize = () => this.positionWordImage();
    window.addEventListener('resize', onResize);
    this.scene.scale.on('resize', onResize);
  }

  private positionWordImage() {
    if (!this.wordImgEl) return;
    const phaserCanvas = this.scene.game.canvas;
    const rect = phaserCanvas.getBoundingClientRect();
    const scaleX = rect.width  / (this.scene.game.config.width  as number);
    const scaleY = rect.height / (this.scene.game.config.height as number);
    const size = 46 * Math.min(scaleX, scaleY);
    const emojiGameX = this.stripX + 46;
    const emojiGameY = this.stripY + this.stripH / 2;
    const wx = rect.left + window.scrollX + emojiGameX * scaleX - size / 2;
    const wy = rect.top  + window.scrollY + emojiGameY * scaleY - size / 2;
    this.wordImgEl.style.left   = `${wx}px`;
    this.wordImgEl.style.top    = `${wy}px`;
    this.wordImgEl.style.width  = `${size}px`;
    this.wordImgEl.style.height = `${size}px`;
  }

  showScore(score: number, completed: number, total: number) {
    this.scoreText.setText(`Điểm: ${score}`);
    this.progressText.setText(`${completed + 1} / ${total}`);
  }

  showAIReady() {
    this.aiStatusText.setText('🤖 Sẵn sàng!');
    this.scene.time.delayedCall(2500, () => this.aiStatusText.setVisible(false));
  }

  showThinking() {
    this.aiStatusText.setVisible(true);
    this.aiStatusText.setText('🤖 Đang đoán...');
  }

  showResult(result: EvaluateResult, currentScore: number) {
    this.aiStatusText.setVisible(false);
    this.scoreText.setText(`Điểm: ${currentScore}`);

    this.resultOverlay.removeAll(true);
    this.resultOverlay.setVisible(true);

    const W = this.canvasW - 20;
    const H = 190;
    const halfW = W / 2;

    // Semi-transparent backdrop over canvas
    const backdrop = this.scene.add.rectangle(0, 0, this.canvasW, this.canvasH, 0x000000, 0.55);
    this.resultOverlay.add(backdrop);

    const bgColor    = result.correct ? 0x0d3320 : 0x3a0d0d;
    const borderColor = result.correct ? 0x2ecc71 : 0xe74c3c;
    const panel = this.scene.add.rectangle(0, 0, W, H, bgColor);
    panel.setStrokeStyle(2, borderColor);
    this.resultOverlay.add(panel);

    if (result.correct) {
      this.resultOverlay.add(this.scene.add.text(0, -H / 2 + 20, '🎉 Đúng rồi!', {
        fontSize: '26px', color: '#2ecc71', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5, 0));

      this.resultOverlay.add(this.scene.add.text(0, -H / 2 + 56, `+${result.points} điểm!`, {
        fontSize: '22px', color: '#f1c40f', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5, 0));

      const aiLabel = result.matchedLabel.split(',')[0].trim();
      this.resultOverlay.add(this.scene.add.text(0, -H / 2 + 86, `AI: "${aiLabel}"`, {
        fontSize: '15px', color: '#aaffaa', fontFamily: 'Arial',
      }).setOrigin(0.5, 0));
    } else {
      this.resultOverlay.add(this.scene.add.text(0, -H / 2 + 20, '😅 Chưa đúng!', {
        fontSize: '26px', color: '#e74c3c', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5, 0));

      const topLabel = result.topGuess.split(',')[0].trim();
      this.resultOverlay.add(this.scene.add.text(0, -H / 2 + 56, `AI nghĩ là: "${topLabel}"`, {
        fontSize: '15px', color: '#ffaaaa', fontFamily: 'Arial',
        wordWrap: { width: W - 20 }, align: 'center',
      }).setOrigin(0.5, 0));

      this.resultOverlay.add(this.scene.add.text(0, -H / 2 + 84, 'Thử lại hoặc bỏ qua!', {
        fontSize: '13px', color: '#ccaaaa', fontFamily: 'Arial',
      }).setOrigin(0.5, 0));
    }

    // "Next Word" button
    const btnY = H / 2 - 28;
    const btnBg = this.scene.add.rectangle(0, btnY, 160, 40, COLORS.ACCENT);
    btnBg.setStrokeStyle(1, 0xffffff, 0.4);
    btnBg.setInteractive({ useHandCursor: true });
    const btnText = this.scene.add.text(0, btnY, 'Từ tiếp theo →', {
      fontSize: '15px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    btnBg.on('pointerover',  () => btnBg.setAlpha(0.8));
    btnBg.on('pointerout',   () => btnBg.setAlpha(1));
    btnBg.on('pointerdown',  () => this.onNextWord?.());
    this.resultOverlay.add([btnBg, btnText]);
  }

  showRoundEnd(score: number) {
    this.resultOverlay.removeAll(true);
    this.resultOverlay.setVisible(true);

    const W = this.canvasW - 20;
    const H = 240;

    const backdrop = this.scene.add.rectangle(0, 0, this.canvasW, this.canvasH, 0x000000, 0.65);
    this.resultOverlay.add(backdrop);

    const panel = this.scene.add.rectangle(0, 0, W, H, 0x0f3460);
    panel.setStrokeStyle(2, 0xe94560);
    this.resultOverlay.add(panel);

    this.resultOverlay.add(this.scene.add.text(0, -H / 2 + 20, '🏆 Kết thúc vòng!', {
      fontSize: '26px', color: '#f1c40f', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0));

    this.resultOverlay.add(this.scene.add.text(0, -H / 2 + 58, `Tổng điểm: ${score}`, {
      fontSize: '30px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0));

    // Play Again
    const againBg = this.scene.add.rectangle(-90, H / 2 - 40, 150, 44, 0x2ecc71);
    againBg.setInteractive({ useHandCursor: true });
    const againText = this.scene.add.text(-90, H / 2 - 40, '▶ Chơi lại', {
      fontSize: '15px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    againBg.on('pointerdown', () => this.onNextWord?.());

    // Menu
    const menuBg = this.scene.add.rectangle(90, H / 2 - 40, 150, 44, 0x555577);
    menuBg.setInteractive({ useHandCursor: true });
    const menuText = this.scene.add.text(90, H / 2 - 40, '⬅ Trang chủ', {
      fontSize: '15px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    menuBg.on('pointerdown', () => this.onBackToMenu?.());

    this.resultOverlay.add([againBg, againText, menuBg, menuText]);
  }

  hideResult() {
    this.resultOverlay.setVisible(false);
  }

  destroy() {
    this.wordImgEl?.remove();
    this.wordImgEl = null;
  }
}
