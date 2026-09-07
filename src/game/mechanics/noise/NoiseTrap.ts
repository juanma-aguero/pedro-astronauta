import Phaser from "phaser";
import { ASSET_KEYS } from "../../config/assetKeys";
import type { NoiseSystem } from "./NoiseSystem";

export interface NoiseTrapConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Loudness of the burst, 0..1. Default 1 (maximum). */
  intensity?: number;
  /** Hearing radius of the burst. Default 720. */
  radius?: number;
  /** Minimum gap between bursts so it cannot fire every frame. Default 1200 ms. */
  cooldownMs?: number;
}

const DEFAULTS = {
  intensity: 1,
  radius: 720,
  cooldownMs: 1200,
} as const;

/**
 * A loose environmental noise source — a pile of scrap / a hanging plate. It
 * never damages Pedro; touching it emits one loud `environment` NoiseEvent (on a
 * cooldown) to lure nearby Oscuros. Deliberately not a physics puzzle.
 */
export class NoiseTrap extends Phaser.Physics.Arcade.Image {
  private readonly config: Required<NoiseTrapConfig>;
  private readonly noiseSystem: NoiseSystem;
  private readonly visual: Phaser.GameObjects.Container;
  private cooldownUntil = 0;

  constructor(scene: Phaser.Scene, config: NoiseTrapConfig, noiseSystem: NoiseSystem) {
    super(scene, config.x, config.y, ASSET_KEYS.platform);

    this.config = {
      ...config,
      intensity: config.intensity ?? DEFAULTS.intensity,
      radius: config.radius ?? DEFAULTS.radius,
      cooldownMs: config.cooldownMs ?? DEFAULTS.cooldownMs,
    };
    this.noiseSystem = noiseSystem;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setVisible(false);
    this.setDisplaySize(config.width, config.height);
    this.refreshBody();

    this.visual = this.buildVisual(scene, config);
  }

  /** Attempt to fire the trap. Returns true only when a burst was emitted. */
  trigger(now: number): boolean {
    if (now < this.cooldownUntil) return false;
    this.cooldownUntil = now + this.config.cooldownMs;

    this.noiseSystem.emit({
      x: this.config.x,
      y: this.config.y,
      kind: "environment",
      intensity: this.config.intensity,
      radius: this.config.radius,
    }, now);

    this.reactVisually();
    return true;
  }

  private buildVisual(scene: Phaser.Scene, config: NoiseTrapConfig): Phaser.GameObjects.Container {
    const g = scene.add.graphics();
    const hw = config.width / 2;
    const hh = config.height / 2;
    // A leaning scrap plate with a couple of loose bars.
    g.fillStyle(0x1c2434, 1).fillRoundedRect(-hw, -hh, config.width, config.height, 4);
    g.lineStyle(2, 0x3a4a66, 1).strokeRoundedRect(-hw, -hh, config.width, config.height, 4);
    g.lineStyle(3, 0x2a3346, 1);
    g.lineBetween(-hw + 6, hh - 4, hw - 10, -hh + 6);
    g.lineBetween(-hw + 14, hh - 4, hw - 2, hh - 10);
    // Warning glint so it is visually distinguishable from safe terrain.
    g.fillStyle(0xffb43c, 0.9).fillCircle(hw - 8, -hh + 8, 3);

    const container = scene.add.container(config.x, config.y, [g]).setDepth(3);
    scene.tweens.add({ targets: g, alpha: 0.6, duration: 900, yoyo: true, repeat: -1 });
    return container;
  }

  private reactVisually(): void {
    this.scene.tweens.add({
      targets: this.visual, scaleX: 1.08, scaleY: 0.9, angle: 3,
      duration: 90, yoyo: true, repeat: 2,
    });
    const ring = this.scene.add.image(this.config.x, this.config.y, ASSET_KEYS.silencioNoiseRing)
      .setTint(0xffca66)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(20).setScale(0.3).setAlpha(0.85);
    this.scene.tweens.add({
      targets: ring, scale: 14, alpha: 0,
      duration: 700, ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
  }

  destroy(fromScene?: boolean): void {
    this.visual?.destroy();
    super.destroy(fromScene);
  }
}
