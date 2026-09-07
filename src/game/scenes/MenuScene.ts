import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/gameConfig";
import { createTextButton } from "../ui/createTextButton";
import { menuBackdrop } from "../art/MenuArt";
import { ASSET_KEYS } from "../config/assetKeys";
import { ANIMATIONS, PLAYER_FRAMES } from "../config/artManifest";

/** Title screen. All player-facing copy is Spanish. */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create(): void {
    menuBackdrop(this);
    const centerX = GAME_WIDTH / 2;

    this.add.sprite(centerX, GAME_HEIGHT * 0.78, ASSET_KEYS.playerArt, 0)
      .setOrigin(0.5, PLAYER_FRAMES.baseline / PLAYER_FRAMES.height)
      .setScale(1.6)
      .play(ANIMATIONS.idle);

    this.add
      .text(centerX, GAME_HEIGHT * 0.26, "PEDRO", {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "108px",
        color: "#fff0d2",
        fontStyle: "bold",
        stroke: "#322246", strokeThickness: 7,
        shadow: { offsetX: 0, offsetY: 6, color: "#090a1d", blur: 14, fill: true },
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, GAME_HEIGHT * 0.38, "EL NIÑO ASTRONAUTA", {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "28px",
        color: "#c9c2f0",
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, GAME_HEIGHT * 0.47, "Una aventura a través de mundos desconocidos", {
        fontFamily: "Trebuchet MS, sans-serif", fontSize: "20px", color: "#cac1dd",
      })
      .setOrigin(0.5);

    createTextButton(this, centerX, GAME_HEIGHT * 0.6, "JUGAR", () => {
      this.scene.start("WorldSelectScene");
    });

    this.add
      .text(centerX, GAME_HEIGHT * 0.9, "A / D  o  ← →   ·   ESPACIO para saltar", {
        fontFamily: "Trebuchet MS, sans-serif", fontSize: "16px", color: "#b2a9ca",
      })
      .setOrigin(0.5);
  }
}
