import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS } from '../../config';
import { getLevelConfig, getWorldDefs, getAllLevels, LevelConfig } from './MathKingdomData';
import { MathKingdomState } from './MathKingdomState';
import { GuideCharacter } from './GuideCharacter';
import { BaseMiniGame, MiniGameResult } from './minigames/BaseMiniGame';
import { CountingMiniGame }    from './minigames/CountingMiniGame';
import { TapNumberMiniGame }   from './minigames/TapNumberMiniGame';
import { DragMatchMiniGame }   from './minigames/DragMatchMiniGame';
import { CountByColorMiniGame }from './minigames/CountByColorMiniGame';
import { SortGroupMiniGame }   from './minigames/SortGroupMiniGame';
import { UnlockMiniGame }      from './minigames/UnlockMiniGame';

export class MathKingdomGameScene extends Phaser.Scene {
  private cfg!:        LevelConfig;
  private guide!:      GuideCharacter;
  private miniGame!:   BaseMiniGame;
  private hintTimer?:  Phaser.Time.TimerEvent;
  private levelId!:    number;

  constructor() { super({ key: SCENE_KEYS.MATH_KINGDOM_GAME }); }

  init(data: { levelId: number }) {
    this.levelId = data.levelId ?? 1;
    this.cfg     = getLevelConfig(this.levelId)!;
  }

  preload() {
    // 📦 Asset slots — provide images later in public/assets/math-kingdom/
    // this.load.image('mk_guide',    'assets/math-kingdom/guide.png');
    // this.load.image('mk_bg_game',  'assets/math-kingdom/game_bg.png');
  }

  create() {
    this.drawBackground();
    this.drawHeader();
    this.drawProgressStrip();
    this.spawnGuide();
    this.loadMiniGame();
    this.startHintTimer();
  }

  // ── Background ─────────────────────────────────────────────────────────────
  private drawBackground() {
    const world = getWorldDefs().find(w => w.worldId === this.cfg.worldId)!;
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, world.bgColor);
    const g = this.add.graphics().setAlpha(0.04);
    for (let i = 0; i < 25; i++) {
      g.fillStyle(0xffffff);
      g.fillCircle(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(0, GAME_HEIGHT), Phaser.Math.Between(1, 3));
    }
  }

  // ── Header (depth 20 — always on top) ─────────────────────────────────────
  private drawHeader() {
    this.add.rectangle(GAME_WIDTH / 2, 22, GAME_WIDTH, 44, 0x0a1628).setDepth(20);

    const back = this.add.text(14, 10, '⬅ Map', {
      fontSize: '14px', color: '#aaaacc', fontFamily: 'Arial',
    }).setDepth(20).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#ffffff'));
    back.on('pointerout',  () => back.setColor('#aaaacc'));
    back.on('pointerdown', () => this.goToMap());

    this.add.text(GAME_WIDTH / 2, 10, `🏰 Cấp ${this.levelId}`, {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(20);
  }

  // ── Progress dots (one per level in this world) ────────────────────────────
  private drawProgressStrip() {
    const world = getWorldDefs().find(w => w.worldId === this.cfg.worldId)!;
    const y     = 62;
    this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH, 26, 0x0f1f38).setDepth(20);

    const worldLevels = world.levels;
    const n  = worldLevels.length;
    const totalW = n * 16 + (n - 1) * 8;
    let startX   = GAME_WIDTH / 2 - totalW / 2 + 8;

    worldLevels.forEach(l => {
      const done = MathKingdomState.getInstance().getStars(l.levelId) > 0;
      const cur  = l.levelId === this.levelId;
      const col  = cur ? world.nodeColor : done ? 0x888888 : 0x333333;
      const r    = this.add.arc(startX, y, cur ? 8 : 6, 0, 360, false, col).setDepth(20);
      if (cur) {
        this.tweens.add({ targets: r, scaleX: 1.3, scaleY: 1.3, ease: 'Sine.easeInOut', duration: 600, yoyo: true, repeat: -1 });
      }
      startX += 24;
    });

    // World name
    this.add.text(14, y - 7, `${world.emoji} ${world.name}`, {
      fontSize: '12px', color: '#8899bb', fontFamily: 'Arial',
    }).setDepth(20);
  }

  // ── Guide character ─────────────────────────────────────────────────────────
  private spawnGuide() {
    this.guide = new GuideCharacter(this, 52, GAME_HEIGHT - 120);
  }

  // ── Mini-game factory ───────────────────────────────────────────────────────
  private loadMiniGame() {
    switch (this.cfg.miniGame) {
      case 'counting':     this.miniGame = new CountingMiniGame(this, this.cfg, this.guide);     break;
      case 'tapNumber':    this.miniGame = new TapNumberMiniGame(this, this.cfg, this.guide);    break;
      case 'dragMatch':    this.miniGame = new DragMatchMiniGame(this, this.cfg, this.guide);    break;
      case 'countByColor': this.miniGame = new CountByColorMiniGame(this, this.cfg, this.guide); break;
      case 'sortGroup':    this.miniGame = new SortGroupMiniGame(this, this.cfg, this.guide);    break;
      case 'unlock':       this.miniGame = new UnlockMiniGame(this, this.cfg, this.guide);       break;
    }
    this.miniGame.build();
    this.events.once('minigame-complete', this.onComplete, this);
  }

  // ── Hint timer ─────────────────────────────────────────────────────────────
  private startHintTimer() {
    this.hintTimer = this.time.delayedCall(this.cfg.hintDelay, () => {
      this.miniGame.showHint();
    });
  }

  // ── On level complete ───────────────────────────────────────────────────────
  private onComplete(result: MiniGameResult) {
    this.hintTimer?.destroy();
    MathKingdomState.getInstance().saveResult(this.levelId, result.stars);
    this.time.delayedCall(400, () => {
      this.cameras.main.fadeOut(380, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SCENE_KEYS.MATH_KINGDOM_REWARD, {
          levelId: this.levelId,
          stars:   result.stars,
        });
      });
    });
  }

  private goToMap() {
    this.hintTimer?.destroy();
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENE_KEYS.MATH_KINGDOM_MAP);
    });
  }

  shutdown() {
    this.hintTimer?.destroy();
    this.miniGame?.destroy();
    this.guide?.destroy();
    this.events.off('minigame-complete');
  }
}
