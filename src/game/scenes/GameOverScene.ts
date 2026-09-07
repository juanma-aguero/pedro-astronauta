import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/gameConfig";
import { createTextButton } from "../ui/createTextButton";
import { menuBackdrop } from "../art/SatenesArt";

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  create(): void {
    // Result scenes must stop Satenes before they display.
    this.scene.stop("SatenesScene");
    menuBackdrop(this);

    const centerX = GAME_WIDTH / 2;

    this.add
      .text(centerX, GAME_HEIGHT * 0.36, "GAME OVER", {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "88px",
        color: "#ff9fba",
        fontStyle: "bold",
        stroke: "#321c42", strokeThickness: 5,
      })
      .setOrigin(0.5);

    createTextButton(this, centerX, GAME_HEIGHT * 0.62, "REINTENTAR", () => {
      this.scene.start("SatenesScene");
    });
  }
}
