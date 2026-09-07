import Phaser from "phaser";
import { ASSET_KEYS } from "../../config/assetKeys";
import { BODY_SIZES } from "../../config/artManifest";
import { PLUSH_FRAME } from "../../art/PinosArt";

export interface HeavyMetalPlushConfig {
  x: number;
  y: number;

  patrolMinX: number;
  patrolMaxX: number;

  detectionRange: number;

  patrolSpeed: number;
  chargeSpeed: number;

  windUpMs?: number;
  chargeDurationMs?: number;
  recoveryMs?: number;

  /** How far a charge may carry the plush past its patrol edges. */
  maxChargeOvershoot?: number;
}

export type TargetPositionProvider = () => Readonly<{ x: number; y: number }>;

type PlushState = "patrol" | "wind_up" | "charge" | "recover" | "return";

const DEFAULTS = {
  windUpMs: 380,
  chargeDurationMs: 620,
  recoveryMs: 520,
  maxChargeOvershoot: 180,
} as const;

/**
 * Only notice Pedro when he shares roughly the same floor. Pedro on a platform
 * overhead is ignored, exactly like the Blue Monster.
 */
const DETECTION_VERTICAL_BAND = 96;
const RESUME_PATROL_EPSILON = 8;

/**
 * Heavy Metal Plush. Heavier and more mechanical than the Blue Monster: it
 * patrols slowly, then commits to a single telegraphed straight-line charge in
 * the direction Pedro was in when the charge began. It never homes continuously.
 *
 * State machine: patrol -> wind_up -> charge -> recover -> return -> patrol.
 */
export class HeavyMetalPlush extends Phaser.Physics.Arcade.Sprite {
  private readonly config: Required<HeavyMetalPlushConfig>;
  private readonly getTarget: TargetPositionProvider;
  private readonly art: Phaser.GameObjects.Sprite;

  private plushState: PlushState = "patrol";
  private patrolDirection: 1 | -1 = 1;
  private stateEnteredAt = 0;
  private chargeDirection: 1 | -1 = 1;

  private readonly overshootMinX: number;
  private readonly overshootMaxX: number;

  constructor(
    scene: Phaser.Scene,
    config: HeavyMetalPlushConfig,
    getTarget: TargetPositionProvider,
  ) {
    super(scene, config.x, config.y, ASSET_KEYS.pinosPlushBody);

    this.config = {
      ...DEFAULTS,
      ...config,
      windUpMs: config.windUpMs ?? DEFAULTS.windUpMs,
      chargeDurationMs: config.chargeDurationMs ?? DEFAULTS.chargeDurationMs,
      recoveryMs: config.recoveryMs ?? DEFAULTS.recoveryMs,
      maxChargeOvershoot: config.maxChargeOvershoot ?? DEFAULTS.maxChargeOvershoot,
    };
    this.getTarget = getTarget;
    this.overshootMinX = this.config.patrolMinX - this.config.maxChargeOvershoot;
    this.overshootMaxX = this.config.patrolMaxX + this.config.maxChargeOvershoot;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(false);
    this.setBounce(0);
    this.setVisible(false);
    (this.body as Phaser.Physics.Arcade.Body).setSize(BODY_SIZES.plush.width, BODY_SIZES.plush.height);

    this.art = scene.add.sprite(config.x, config.y, ASSET_KEYS.pinosPlushArt)
      .setOrigin(0.5, PLUSH_FRAME.baseline / PLUSH_FRAME.height)
      .setDepth(8);

    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncArt, this);
  }

  update(time: number): void {
    const target = this.getTarget();
    const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    const verticalGap = Math.abs(this.y - target.y);
    const elapsed = time - this.stateEnteredAt;

    switch (this.plushState) {
      case "patrol":
        this.movePatrol();
        if (this.canDetect(distance, verticalGap)) {
          this.chargeDirection = target.x >= this.x ? 1 : -1;
          this.enter("wind_up", time);
        }
        break;

      case "wind_up":
        this.setVelocityX(0);
        // Keep facing the committed direction; re-aim only slightly.
        if (elapsed >= this.config.windUpMs) this.enter("charge", time);
        break;

      case "charge": {
        const clampedX = Phaser.Math.Clamp(this.x, this.overshootMinX, this.overshootMaxX);
        const blocked = clampedX !== this.x;
        if (blocked) this.x = clampedX;
        this.setVelocityX(blocked ? 0 : this.config.chargeSpeed * this.chargeDirection);
        if (blocked || elapsed >= this.config.chargeDurationMs) this.enter("recover", time);
        break;
      }

      case "recover":
        this.setVelocityX(0);
        if (elapsed >= this.config.recoveryMs) this.enter("return", time);
        break;

      case "return":
        this.moveReturn();
        if (this.isInsidePatrolInterval()) this.enter("patrol", time);
        break;
    }

    this.updateFacing();
  }

  private enter(state: PlushState, time: number): void {
    this.plushState = state;
    this.stateEnteredAt = time;
  }

  private canDetect(distance: number, verticalGap: number): boolean {
    return distance <= this.config.detectionRange && verticalGap <= DETECTION_VERTICAL_BAND;
  }

  private movePatrol(): void {
    if (this.x <= this.config.patrolMinX) this.patrolDirection = 1;
    else if (this.x >= this.config.patrolMaxX) this.patrolDirection = -1;
    this.setVelocityX(this.config.patrolSpeed * this.patrolDirection);
  }

  private moveReturn(): void {
    const nearestInsideX = Phaser.Math.Clamp(this.x, this.config.patrolMinX, this.config.patrolMaxX);
    const direction = Math.sign(nearestInsideX - this.x);
    this.setVelocityX(this.config.patrolSpeed * 1.4 * direction);
  }

  private isInsidePatrolInterval(): boolean {
    return (
      this.x >= this.config.patrolMinX - RESUME_PATROL_EPSILON &&
      this.x <= this.config.patrolMaxX + RESUME_PATROL_EPSILON
    );
  }

  private updateFacing(): void {
    if (this.plushState === "wind_up" || this.plushState === "charge") {
      this.setFlipX(this.chargeDirection < 0);
      return;
    }
    const vx = (this.body as Phaser.Physics.Arcade.Body).velocity.x;
    if (vx < -1) this.setFlipX(true);
    else if (vx > 1) this.setFlipX(false);
  }

  private syncArt(): void {
    if (!this.active) return;
    const time = this.scene.time.now;
    const elapsed = time - this.stateEnteredAt;
    let scaleX = 1;
    let scaleY = 1;
    let jitter = 0;

    if (this.plushState === "wind_up") {
      // Readable anticipation: crouch and rattle before the charge.
      const t = Phaser.Math.Clamp(elapsed / this.config.windUpMs, 0, 1);
      scaleY = 1 - 0.16 * t;
      scaleX = 1 + 0.14 * t;
      jitter = Math.sin(time / 22) * 2.2 * t;
    } else if (this.plushState === "charge") {
      scaleX = 1.12;
      scaleY = 0.94;
    } else if (this.plushState === "recover") {
      const t = Phaser.Math.Clamp(elapsed / this.config.recoveryMs, 0, 1);
      scaleX = 1 + 0.08 * (1 - t);
    }

    this.art
      .setPosition(this.x + jitter, this.y + BODY_SIZES.plush.height / 2)
      .setFlipX(this.flipX)
      .setScale(scaleX, scaleY);
  }

  destroy(fromScene?: boolean): void {
    this.scene?.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncArt, this);
    this.art?.destroy();
    super.destroy(fromScene);
  }
}
