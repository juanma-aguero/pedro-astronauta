import Phaser from "phaser";
import { ASSET_KEYS } from "../config/assetKeys";

export class HealthHud extends Phaser.GameObjects.Container {
  private readonly label: Phaser.GameObjects.Text;
  private readonly hearts: Phaser.GameObjects.Image[];

  constructor(scene: Phaser.Scene, maxHealth: number) {
    super(scene, 20, 18);
    scene.add.existing(this);
    this.setScrollFactor(0).setDepth(1000);
    const panel = scene.add.graphics();
    panel.fillStyle(0x080e24, 0.86).fillRoundedRect(0, 0, 130 + maxHealth * 36, 54, 14);
    panel.lineStyle(2, 0x51578b, 0.8).strokeRoundedRect(0, 0, 130 + maxHealth * 36, 54, 14);
    panel.lineStyle(1, 0x919bcb, 0.35).lineBetween(15, 2, 80, 2);
    this.label = scene.add.text(16, 13, "", { fontFamily: "Trebuchet MS, sans-serif", fontSize: "25px", fontStyle: "bold", color: "#fff8f0" });
    this.hearts = Array.from({ length: maxHealth }, (_, i) => scene.add.image(133 + i * 36, 27, ASSET_KEYS.heart).setDisplaySize(29, 26));
    this.add([panel, this.label, ...this.hearts]);
  }

  refresh(health: number): void {
    this.label.setText(`Vida: ${health}`);
    this.hearts.forEach((heart, i) => heart.setAlpha(i < health ? 1 : 0.18).setTint(i < health ? 0xffffff : 0x6b6387));
  }
}
