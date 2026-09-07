import Phaser from "phaser";
import { ASSET_KEYS } from "../../config/assetKeys";
import { ANIMATIONS, BODY_SIZES, MONSTER_FRAMES } from "../../config/artManifest";

export interface BlueMonsterConfig {
  x: number;
  y: number;
  patrolMinX: number;
  patrolMaxX: number;
  detectionRange: number;
  disengageRange: number;
  maxRoamDistance: number;
  patrolSpeed: number;
  chaseSpeed: number;
}

export type TargetPositionProvider = () => Readonly<{ x: number; y: number }>;

type MonsterState = "patrol" | "chase" | "return";

/** Distance to the patrol interval at which "return" resumes "patrol". */
const RESUME_PATROL_EPSILON = 8;

/**
 * Vertical tolerance for detection. The monster only notices the target when
 * they share roughly the same floor; a target standing on a platform overhead
 * is out of reach, so the monster ignores it and keeps patrolling.
 */
const DETECTION_VERTICAL_BAND = 96;

/**
 * Horizontal deadzone around the target. Within this many pixels the monster
 * holds still instead of flipping direction every frame, which is what happens
 * when the target sits directly above it (e.g. Pedro on a platform overhead).
 */
const CHASE_DEADZONE_X = 12;

/**
 * A Blue Monster. Owns its state machine and horizontal movement. It never
 * reads Pedro's input, health, or class internals: only a target position.
 */
export class BlueMonster extends Phaser.Physics.Arcade.Sprite {
  private readonly config: BlueMonsterConfig;
  private readonly getTarget: TargetPositionProvider;
  private readonly art: Phaser.GameObjects.Sprite;

  private behaviorState: MonsterState = "patrol";
  private patrolDirection: 1 | -1 = 1;

  /** Roam bounds: chase movement is clamped to this interval. */
  private readonly roamMinX: number;
  private readonly roamMaxX: number;

  constructor(
    scene: Phaser.Scene,
    config: BlueMonsterConfig,
    getTarget: TargetPositionProvider,
  ) {
    super(scene, config.x, config.y, ASSET_KEYS.blueMonster);

    this.config = config;
    this.getTarget = getTarget;

    this.roamMinX = config.patrolMinX - config.maxRoamDistance;
    this.roamMaxX = config.patrolMaxX + config.maxRoamDistance;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(false);
    this.setBounce(0);
    this.setVisible(false);
    (this.body as Phaser.Physics.Arcade.Body).setSize(BODY_SIZES.monster.width, BODY_SIZES.monster.height);
    this.art = scene.add.sprite(config.x, config.y, ASSET_KEYS.monsterArt, 0)
      .setOrigin(0.5, MONSTER_FRAMES.baseline / MONSTER_FRAMES.height).setDepth(8);
    this.art.play(ANIMATIONS.crawl);
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncArt, this);
  }

  update(): void {
    const target = this.getTarget();
    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      target.x,
      target.y,
    );
    const verticalGap = Math.abs(this.y - target.y);

    switch (this.behaviorState) {
      case "patrol":
        if (this.canDetect(distance, verticalGap)) {
          this.behaviorState = "chase";
        }
        break;
      case "chase":
        if (this.shouldDisengage(distance, verticalGap, target.x)) {
          this.behaviorState = "return";
        }
        break;
      case "return":
        if (this.canDetect(distance, verticalGap)) {
          this.behaviorState = "chase";
        } else if (this.isInsidePatrolInterval()) {
          this.behaviorState = "patrol";
        }
        break;
    }

    switch (this.behaviorState) {
      case "patrol":
        this.movePatrol();
        break;
      case "chase":
        this.moveChase(target.x);
        break;
      case "return":
        this.moveReturn();
        break;
    }

    this.updateFacing();
  }

  private canDetect(distance: number, verticalGap: number): boolean {
    return (
      distance <= this.config.detectionRange &&
      verticalGap <= DETECTION_VERTICAL_BAND
    );
  }

  private shouldDisengage(
    distance: number,
    verticalGap: number,
    targetX: number,
  ): boolean {
    if (distance > this.config.disengageRange) {
      return true;
    }
    // Target climbed out of reach (e.g. onto a platform overhead).
    if (verticalGap > DETECTION_VERTICAL_BAND) {
      return true;
    }
    // Pursuing farther would exceed the roam limits.
    const desiredDirection = Math.sign(targetX - this.x);
    if (desiredDirection < 0 && this.x <= this.roamMinX) {
      return true;
    }
    if (desiredDirection > 0 && this.x >= this.roamMaxX) {
      return true;
    }
    return false;
  }

  private movePatrol(): void {
    if (this.x <= this.config.patrolMinX) {
      this.patrolDirection = 1;
    } else if (this.x >= this.config.patrolMaxX) {
      this.patrolDirection = -1;
    }
    this.setVelocityX(this.config.patrolSpeed * this.patrolDirection);
  }

  private moveChase(targetX: number): void {
    const clampedX = Phaser.Math.Clamp(this.x, this.roamMinX, this.roamMaxX);
    if (clampedX !== this.x) {
      this.x = clampedX;
    }

    let direction =
      Math.abs(targetX - this.x) <= CHASE_DEADZONE_X
        ? 0
        : Math.sign(targetX - this.x);

    // Do not chase past the roam interval edges.
    if (direction < 0 && this.x <= this.roamMinX) {
      direction = 0;
    } else if (direction > 0 && this.x >= this.roamMaxX) {
      direction = 0;
    }

    this.setVelocityX(this.config.chaseSpeed * direction);
  }

  private moveReturn(): void {
    const nearestInsideX = Phaser.Math.Clamp(
      this.x,
      this.config.patrolMinX,
      this.config.patrolMaxX,
    );
    const direction = Math.sign(nearestInsideX - this.x);
    this.setVelocityX(this.config.patrolSpeed * direction);
  }

  private isInsidePatrolInterval(): boolean {
    return (
      this.x >= this.config.patrolMinX - RESUME_PATROL_EPSILON &&
      this.x <= this.config.patrolMaxX + RESUME_PATROL_EPSILON
    );
  }

  private updateFacing(): void {
    const vx = (this.body as Phaser.Physics.Arcade.Body).velocity.x;
    if (vx < -1) {
      this.setFlipX(true);
    } else if (vx > 1) {
      this.setFlipX(false);
    }
  }

  private syncArt(): void {
    if (!this.active) return;
    this.art.setPosition(this.x, this.y + BODY_SIZES.monster.height / 2).setFlipX(this.flipX);
    const moving = Math.abs((this.body as Phaser.Physics.Arcade.Body).velocity.x) > 1;
    this.art.anims.timeScale = !moving ? 0.35 : this.behaviorState === "chase" ? 1.6 : 1;
  }

  destroy(fromScene?: boolean): void {
    this.scene?.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncArt, this);
    this.art?.destroy();
    super.destroy(fromScene);
  }
}
