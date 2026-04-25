import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { DrawGuessScene } from './games/DrawGuess/DrawGuessScene';
import { QuizScene } from './games/QuizAdventure/QuizScene';
import { MemoryScene } from './games/MemoryFlip/MemoryScene';
import { CountingScene } from './games/CountingGame/CountingScene';
import { OddOneOutScene } from './games/OddOneOut/OddOneOutScene';
import { RotatePuzzleScene } from './games/RotatePuzzle/RotatePuzzleScene';
import { ColoringScene } from './games/ColoringGame/ColoringScene';
import { TicTacToeScene } from './games/TicTacToe/TicTacToeScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1a1a2e',
  scene: [BootScene, MenuScene, DrawGuessScene, QuizScene, MemoryScene, CountingScene,
          OddOneOutScene, RotatePuzzleScene, ColoringScene, TicTacToeScene],
  parent: document.body,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);
