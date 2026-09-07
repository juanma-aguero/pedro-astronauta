import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/gameConfig";
import { createTextButton } from "../ui/createTextButton";
import { menuBackdrop } from "../art/MenuArt";
import { WORLD_REGISTRY } from "../planets/worldRegistry";
import { toRunContext } from "../planets/levelNavigation";

/**
 * World / phase picker. Everything on screen is derived from `WORLD_REGISTRY`:
 * adding a phase or a world changes only the registry, never this scene. The
 * card row sizes itself to however many worlds are registered.
 */
export class WorldSelectScene extends Phaser.Scene {
  constructor() {
    super("WorldSelectScene");
  }

  create(): void {
    menuBackdrop(this);
    const centerX = GAME_WIDTH / 2;

    this.add
      .text(centerX, GAME_HEIGHT * 0.12, "ELEGÍ UN MUNDO", {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "52px",
        color: "#fff0d2",
        fontStyle: "bold",
        stroke: "#322246", strokeThickness: 5,
      })
      .setOrigin(0.5);

    const count = WORLD_REGISTRY.length;
    const margin = 48;
    const gap = 28;
    const slotWidth = Math.min(400, (GAME_WIDTH - margin * 2 - gap * (count - 1)) / count);
    const rowWidth = count * slotWidth + (count - 1) * gap;
    let x = centerX - rowWidth / 2 + slotWidth / 2;

    for (const world of WORLD_REGISTRY) {
      this.drawWorldCard(world.id, world.displayName, world.description, world.levels, x, slotWidth);
      x += slotWidth + gap;
    }

    createTextButton(this, centerX, GAME_HEIGHT * 0.9, "VOLVER", () => {
      this.scene.start("MenuScene");
    }, { fontSize: 24 });
  }

  private drawWorldCard(
    worldId: string,
    displayName: string,
    description: string,
    levels: readonly { id: string; displayName: string }[],
    centerX: number,
    slotWidth: number,
  ): void {
    const top = GAME_HEIGHT * 0.24;
    const width = slotWidth - 12;
    const height = 344;

    const panel = this.add.graphics();
    panel.fillStyle(0x0c1330, 0.9).fillRoundedRect(centerX - width / 2, top, width, height, 18);
    panel.lineStyle(2, 0x5b62a0, 0.85).strokeRoundedRect(centerX - width / 2, top, width, height, 18);

    this.add
      .text(centerX, top + 44, displayName, {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "34px",
        color: "#ffe6b8",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, top + 82, description, {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "16px",
        color: "#c6cdf0",
        align: "center",
        wordWrap: { width: width - 40 },
      })
      .setOrigin(0.5, 0);

    levels.forEach((level, index) => {
      createTextButton(
        this,
        centerX,
        top + 176 + index * 62,
        level.displayName,
        () => {
          const context = toRunContext(worldId, level.id);
          if (context) this.scene.start(context.sceneKey, context);
        },
        { fontSize: 22 },
      );
    });
  }
}
