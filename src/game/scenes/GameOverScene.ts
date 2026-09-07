import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/gameConfig";
import { createTextButton } from "../ui/createTextButton";
import { menuBackdrop } from "../art/MenuArt";
import { firstRunContext, isLevelRunContext, type LevelRunContext } from "../planets/levelNavigation";

export class GameOverScene extends Phaser.Scene {
  private context!: LevelRunContext;

  constructor() {
    super("GameOverScene");
  }

  init(data: unknown): void {
    this.context = isLevelRunContext(data) ? data : firstRunContext();
  }

  create(): void {
    // Stop whichever phase sent us here before we display.
    this.scene.stop(this.context.sceneKey);
    menuBackdrop(this);

    const centerX = GAME_WIDTH / 2;

    this.add
      .text(centerX, GAME_HEIGHT * 0.32, "GAME OVER", {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "88px",
        color: "#ff9fba",
        fontStyle: "bold",
        stroke: "#321c42", strokeThickness: 5,
      })
      .setOrigin(0.5);

    createTextButton(this, centerX, GAME_HEIGHT * 0.56, "REINTENTAR", () => {
      this.scene.start(this.context.sceneKey, this.context);
    });

    createTextButton(this, centerX, GAME_HEIGHT * 0.72, "VOLVER A MUNDOS", () => {
      this.scene.start("WorldSelectScene");
    }, { fontSize: 24 });
  }
}
