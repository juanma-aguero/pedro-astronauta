import Phaser from "phaser";
import { BootScene } from "../scenes/BootScene";
import { MenuScene } from "../scenes/MenuScene";
import { GameOverScene } from "../scenes/GameOverScene";
import { LevelCompleteScene } from "../scenes/LevelCompleteScene";
import { SatenesScene } from "../planets/satenes/SatenesScene";

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

/** Dark space background color. */
export const BACKGROUND_COLOR = "#090b1a";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: BACKGROUND_COLOR,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 1400 },
      debug: false,
    },
  },
  // Only BootScene and MenuScene run on initial load; the rest are started
  // explicitly through the scene flow.
  scene: [BootScene, MenuScene, SatenesScene, GameOverScene, LevelCompleteScene],
};
