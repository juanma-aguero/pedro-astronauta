import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/gameConfig";
import { createTextButton } from "../ui/createTextButton";
import { menuBackdrop, drawTerrain, addPlant } from "../art/SatenesArt";
import { ASSET_KEYS } from "../config/assetKeys";
import { ANIMATIONS, PLAYER_FRAMES } from "../config/artManifest";

/** Title screen. All player-facing copy is Spanish. */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create(): void {
    menuBackdrop(this);
    drawTerrain(this, { x: 640, y: 690, width: 1280, height: 60 });
    this.add.image(214, 662, ASSET_KEYS.props, "rocket").setOrigin(0.5, 1).setDisplaySize(210, 297);
    this.add.sprite(1002, 662, ASSET_KEYS.playerArt, 0).setOrigin(0.5, PLAYER_FRAMES.baseline / PLAYER_FRAMES.height).setScale(1.5).play(ANIMATIONS.idle);
    addPlant(this, 70, 663, 80);
    addPlant(this, 1180, 663, 94);
    const centerX = GAME_WIDTH / 2;

    this.add
      .text(centerX, GAME_HEIGHT * 0.28, "PEDRO", {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "108px",
        color: "#fff0d2",
        fontStyle: "bold",
        stroke: "#322246", strokeThickness: 7,
        shadow: { offsetX: 0, offsetY: 6, color: "#090a1d", blur: 14, fill: true },
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, GAME_HEIGHT * 0.40, "EL NIÑO ASTRONAUTA", {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "28px",
        color: "#c9c2f0",
        letterSpacing: 5,
      })
      .setOrigin(0.5);

    this.add.text(centerX, 360, "Una aventura en el planeta Satenes", { fontFamily: "Trebuchet MS, sans-serif", fontSize: "20px", color: "#cac1dd" }).setOrigin(0.5);
    createTextButton(this, centerX, GAME_HEIGHT * 0.64, "JUGAR", () => {
      this.scene.start("SatenesScene");
    });
    this.add.text(centerX, 533, "A / D  o  ← →   ·   ESPACIO para saltar", { fontFamily: "Trebuchet MS, sans-serif", fontSize: "16px", color: "#b2a9ca" }).setOrigin(0.5);
  }
}
