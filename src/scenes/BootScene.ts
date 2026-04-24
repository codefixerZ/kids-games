import * as Phaser from 'phaser';
import { SCENE_KEYS } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT });
  }

  preload() {
    // No external assets needed — all UI is drawn with Phaser primitives
  }

  create() {
    this.scene.start(SCENE_KEYS.MENU);
  }
}
