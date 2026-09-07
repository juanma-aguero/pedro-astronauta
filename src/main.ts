import Phaser from "phaser";
import { gameConfig } from "./game/config/gameConfig";

const game = new Phaser.Game(gameConfig);

if (import.meta.env.DEV) {
  (window as unknown as { game: Phaser.Game }).game = game;
}
