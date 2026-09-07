import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/gameConfig";
import { createTextButton } from "../ui/createTextButton";
import { menuBackdrop } from "../art/SatenesArt";
import { ASSET_KEYS } from "../config/assetKeys";

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super("LevelCompleteScene");
  }

  create(): void {
    // Result scenes must stop Satenes before they display.
    this.scene.stop("SatenesScene");
    menuBackdrop(this);
    const clue = this.add.image(640, 116, ASSET_KEYS.props, "clue").setDisplaySize(90, 82);
    this.tweens.add({ targets: clue, y: 108, duration: 1500, repeat: -1, yoyo: true });

    const centerX = GAME_WIDTH / 2;

    this.add
      .text(centerX, GAME_HEIGHT * 0.3, "¡Encontraste una pista!", {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "52px",
        color: "#ffe3a2",
        fontStyle: "bold",
        stroke: "#382348", strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(
        centerX,
        GAME_HEIGHT * 0.46,
        "Pedro está un paso más cerca de encontrar a su familia.",
        {
          fontFamily: "Trebuchet MS, sans-serif",
          fontSize: "28px",
          color: "#ffffff",
          align: "center",
          wordWrap: { width: GAME_WIDTH * 0.8 },
        },
      )
      .setOrigin(0.5);

    createTextButton(this, centerX, GAME_HEIGHT * 0.7, "VOLVER A JUGAR", () => {
      this.scene.start("SatenesScene");
    });
  }
}
