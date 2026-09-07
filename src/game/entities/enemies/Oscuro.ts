import Phaser from "phaser";
import { ASSET_KEYS } from "../../config/assetKeys";
import { BODY_SIZES } from "../../config/artManifest";
import { OSCURO_FRAME } from "../../art/SilencioArt";
import { isWithinEarshot, type NoiseEvent, type NoiseListener } from "../../mechanics/noise/noiseTypes";

export interface OscuroConfig {
  x: number;
  y: number;

  /** The small territory it drifts around while dormant and returns to. */
  homeMinX: number;
  homeMaxX: number;

  investigateSpeed: number;
  huntSpeed: number;

  /** 70-100 px. Non-audio safety net so Pedro cannot walk through it silently. */
  closeAwarenessRange: number;

  /** How long a search lasts before it gives up and goes home (1500-3000 ms). */
  searchDurationMs: number;

  /** Optional: scales every heard radius. >1 = sharper ears. Default 1. */
  hearingMultiplier?: number;
  /** Optional: speed while walking home. Default = investigateSpeed. */
  returnSpeed?: number;
  /** Optional: how far it may roam past its home chasing a sound. Default 340. */
  maxChaseDistance?: number;
}

export type TargetPositionProvider = () => Readonly<{ x: number; y: number }>;

type OscuroState = "dormant" | "investigate" | "hunt" | "search" | "return";

/** intensity at/above which a heard noise triggers a HUNT rather than INVESTIGATE. */
const LOUD_THRESHOLD = 0.8;
/** How long a HUNT stays aggressive after the last loud noise. */
const HUNT_MS = 2500;
/** Close enough to "arrive" at a remembered noise location. */
const ARRIVE_EPSILON = 20;
/** Vertical tolerance for the close-range safety net. */
const CLOSE_VERTICAL_BAND = 120;
/** Dormant drift speed as a fraction of investigateSpeed. */
const DORMANT_SPEED_FACTOR = 0.28;

/**
 * An Oscuro. It hunts by sound: it has no long-range sight. It reacts to
 * NoiseEvents it can hear, walking toward *where the sound was* (never toward
 * Pedro's live position), then searches, then goes home. A tiny close-range
 * awareness radius is the only non-audio detection, purely so Pedro cannot walk
 * straight through one while silent.
 *
 * State machine: dormant -> investigate/hunt -> search -> return -> dormant.
 */
export class Oscuro extends Phaser.Physics.Arcade.Sprite implements NoiseListener {
  private readonly config: Required<OscuroConfig>;
  private readonly getTarget: TargetPositionProvider;
  private readonly art: Phaser.GameObjects.Sprite;

  private oscuroState: OscuroState = "dormant";
  private stateEnteredAt = 0;
  private dormantDirection: 1 | -1 = 1;

  private targetX: number;
  private huntUntil = 0;
  private alertUntil = 0;

  private readonly roamMinX: number;
  private readonly roamMaxX: number;

  constructor(
    scene: Phaser.Scene,
    config: OscuroConfig,
    getTarget: TargetPositionProvider,
  ) {
    super(scene, config.x, config.y, ASSET_KEYS.silencioOscuroBody);

    this.config = {
      ...config,
      hearingMultiplier: config.hearingMultiplier ?? 1,
      returnSpeed: config.returnSpeed ?? config.investigateSpeed,
      maxChaseDistance: config.maxChaseDistance ?? 340,
    };
    this.getTarget = getTarget;
    this.targetX = config.x;
    this.roamMinX = config.homeMinX - this.config.maxChaseDistance;
    this.roamMaxX = config.homeMaxX + this.config.maxChaseDistance;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(false);
    this.setBounce(0);
    this.setVisible(false);
    (this.body as Phaser.Physics.Arcade.Body).setSize(BODY_SIZES.oscuro.width, BODY_SIZES.oscuro.height);

    this.art = scene.add.sprite(config.x, config.y, ASSET_KEYS.silencioOscuroArt)
      .setOrigin(0.5, OSCURO_FRAME.baseline / OSCURO_FRAME.height)
      .setDepth(8);

    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncArt, this);
  }

  /** NoiseListener. Called synchronously by the NoiseSystem for every event. */
  onNoise(event: NoiseEvent): void {
    if (!this.active) return;
    if (!isWithinEarshot(this.x, this.y, event, this.config.hearingMultiplier)) return;

    const now = this.scene.time.now;
    this.targetX = event.x;
    this.alertUntil = now + 450;
    this.spawnHearRing();

    if (event.intensity >= LOUD_THRESHOLD) {
      this.huntUntil = now + HUNT_MS;
      this.enter("hunt", now);
    } else if (this.oscuroState === "dormant" || this.oscuroState === "return" || this.oscuroState === "search") {
      this.enter("investigate", now);
    }
  }

  update(time: number): void {
    const elapsed = time - this.stateEnteredAt;

    // Non-audio safety net: something is right on top of it.
    const target = this.getTarget();
    if (
      Math.abs(target.y - this.y) <= CLOSE_VERTICAL_BAND &&
      Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y) <= this.config.closeAwarenessRange
    ) {
      this.targetX = target.x;
      this.huntUntil = time + HUNT_MS;
      if (this.oscuroState !== "hunt") this.enter("hunt", time);
    }

    switch (this.oscuroState) {
      case "dormant":
        this.moveDormant();
        break;

      case "investigate":
        this.moveToward(this.targetX, this.config.investigateSpeed);
        if (Math.abs(this.clampedTargetX() - this.x) <= ARRIVE_EPSILON) this.enter("search", time);
        break;

      case "hunt":
        this.moveToward(this.targetX, this.config.huntSpeed);
        if (time > this.huntUntil) {
          this.enter(Math.abs(this.clampedTargetX() - this.x) <= ARRIVE_EPSILON ? "search" : "investigate", time);
        }
        break;

      case "search": {
        // Pause and sweep a short arc, staying dangerous.
        const sweep = Math.sin(elapsed / 180) * 40;
        this.moveToward(this.x + sweep, this.config.investigateSpeed * 0.5);
        if (elapsed >= this.config.searchDurationMs) this.enter("return", time);
        break;
      }

      case "return":
        this.moveToward(this.homeCenter(), this.config.returnSpeed);
        if (this.x >= this.config.homeMinX && this.x <= this.config.homeMaxX) this.enter("dormant", time);
        break;
    }

    this.updateFacing();
  }

  private enter(state: OscuroState, time: number): void {
    this.oscuroState = state;
    this.stateEnteredAt = time;
  }

  private homeCenter(): number {
    return (this.config.homeMinX + this.config.homeMaxX) / 2;
  }

  private clampedTargetX(): number {
    return Phaser.Math.Clamp(this.targetX, this.roamMinX, this.roamMaxX);
  }

  private moveDormant(): void {
    if (this.x <= this.config.homeMinX) this.dormantDirection = 1;
    else if (this.x >= this.config.homeMaxX) this.dormantDirection = -1;
    this.setVelocityX(this.config.investigateSpeed * DORMANT_SPEED_FACTOR * this.dormantDirection);
  }

  private moveToward(x: number, speed: number): void {
    const destination = Phaser.Math.Clamp(x, this.roamMinX, this.roamMaxX);
    const delta = destination - this.x;
    if (Math.abs(delta) <= 2) {
      this.setVelocityX(0);
      return;
    }
    this.setVelocityX(Math.sign(delta) * speed);
  }

  private updateFacing(): void {
    const vx = (this.body as Phaser.Physics.Arcade.Body).velocity.x;
    if (vx < -1) this.setFlipX(true);
    else if (vx > 1) this.setFlipX(false);
  }

  private spawnHearRing(): void {
    const ring = this.scene.add.image(this.x, this.y - BODY_SIZES.oscuro.height / 2, ASSET_KEYS.silencioNoiseRing)
      .setTint(0x8ff0ea).setBlendMode(Phaser.BlendModes.ADD).setDepth(9).setScale(0.2).setAlpha(0.7);
    this.scene.tweens.add({
      targets: ring, scale: 1.6, alpha: 0,
      duration: 520, ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
  }

  private syncArt(): void {
    if (!this.active) return;
    const now = this.scene.time.now;
    const alerted = now < this.alertUntil;
    const aggressive = this.oscuroState === "hunt" || this.oscuroState === "investigate";

    // Idle breathing; a snap-up + brighten while reacting.
    const breathe = Math.sin(now / 900) * 0.012;
    const rise = alerted ? 0.06 : aggressive ? 0.03 : 0;
    this.art
      .setPosition(this.x, this.y + BODY_SIZES.oscuro.height / 2)
      .setFlipX(this.flipX)
      .setScale(1, 1 + breathe + rise);
    this.art.setTint(alerted ? 0xbafffb : aggressive ? 0x9fdfff : 0xffffff);
  }

  destroy(fromScene?: boolean): void {
    this.scene?.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncArt, this);
    this.art?.destroy();
    super.destroy(fromScene);
  }
}
