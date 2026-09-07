import Phaser from "phaser";

const SEGMENTS = 10;
const SEG_W = 15;
const SEG_H = 16;
const SEG_GAP = 3;

/**
 * Silencio-only meter showing how much noise Pedro is making right now. No
 * numbers or percentages — just a bar that jumps up on noise and falls back
 * quickly, tinted green / amber / red as it fills. Sits under the HealthHud.
 */
export class NoiseHud extends Phaser.GameObjects.Container {
  private readonly segments: Phaser.GameObjects.Rectangle[];

  constructor(scene: Phaser.Scene) {
    super(scene, 20, 84);
    scene.add.existing(this);
    this.setScrollFactor(0).setDepth(1000);

    const panelW = 30 + SEGMENTS * (SEG_W + SEG_GAP);
    const panel = scene.add.graphics();
    panel.fillStyle(0x080e24, 0.86).fillRoundedRect(0, 0, panelW, 42, 12);
    panel.lineStyle(2, 0x51578b, 0.8).strokeRoundedRect(0, 0, panelW, 42, 12);

    const label = scene.add.text(12, 4, "RUIDO", {
      fontFamily: "Trebuchet MS, sans-serif", fontSize: "13px", fontStyle: "bold", color: "#a9b3dd",
    });

    this.segments = Array.from({ length: SEGMENTS }, (_, i) =>
      scene.add.rectangle(14 + i * (SEG_W + SEG_GAP), 22, SEG_W, SEG_H, 0xffffff)
        .setOrigin(0, 0.5)
        .setStrokeStyle(1, 0x2b3358),
    );

    this.add([panel, label, ...this.segments]);
    this.refresh(0);
  }

  /** `meter` is 0..1 (NoiseSystem.getMeter()). */
  refresh(meter: number): void {
    const active = Math.round(Phaser.Math.Clamp(meter, 0, 1) * SEGMENTS);
    this.segments.forEach((seg, i) => {
      const on = i < active;
      const color = i < SEGMENTS * 0.4 ? 0x4fd08a : i < SEGMENTS * 0.7 ? 0xffc24a : 0xff5f6a;
      seg.setFillStyle(color, on ? 1 : 0.12);
    });
  }
}
