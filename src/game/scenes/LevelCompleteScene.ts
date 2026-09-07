import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/gameConfig";
import { createTextButton } from "../ui/createTextButton";
import { menuBackdrop } from "../art/MenuArt";
import { ASSET_KEYS } from "../config/assetKeys";
import { firstRunContext, isLevelRunContext, type LevelRunContext } from "../planets/levelNavigation";
import { getNextLevel } from "../planets/worldRegistry";

export class LevelCompleteScene extends Phaser.Scene {
  private context!: LevelRunContext;

  constructor() {
    super("LevelCompleteScene");
  }

  init(data: unknown): void {
    this.context = isLevelRunContext(data) ? data : firstRunContext();
  }

  create(): void {
    this.scene.stop(this.context.sceneKey);
    menuBackdrop(this);

    const centerX = GAME_WIDTH / 2;

    const clue = this.add.image(centerX, 116, ASSET_KEYS.clueIcon).setDisplaySize(64, 64);
    this.tweens.add({ targets: clue, y: 104, duration: 1500, repeat: -1, yoyo: true, ease: "Sine.easeInOut" });

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
      .text(centerX, GAME_HEIGHT * 0.44, "Pedro está un paso más cerca de encontrar a su familia.", {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "26px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: GAME_WIDTH * 0.8 },
      })
      .setOrigin(0.5);

    const nextLevel = getNextLevel(this.context.worldId, this.context.levelId);
    const buttonY = nextLevel ? GAME_HEIGHT * 0.62 : GAME_HEIGHT * 0.64;

    createTextButton(this, centerX, buttonY, "REJUGAR FASE", () => {
      this.scene.start(this.context.sceneKey, this.context);
    }, { fontSize: 26 });

    if (nextLevel) {
      createTextButton(this, centerX, GAME_HEIGHT * 0.76, "SIGUIENTE FASE", () => {
        this.scene.start(nextLevel.sceneKey, {
          worldId: this.context.worldId,
          levelId: nextLevel.id,
          sceneKey: nextLevel.sceneKey,
        });
      }, { fontSize: 26 });
    }

    createTextButton(this, centerX, nextLevel ? GAME_HEIGHT * 0.88 : GAME_HEIGHT * 0.78, "VOLVER A MUNDOS", () => {
      this.scene.start("WorldSelectScene");
    }, { fontSize: 22 });
  }
}
