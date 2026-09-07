import Phaser from "phaser";
import { ASSET_KEYS } from "../config/assetKeys";
import { PLAYER_TUNING } from "../config/gameplayTuning";
import { ANIMATIONS, BODY_SIZES, PLAYER_FRAMES } from "../config/artManifest";

/** Alpha used while blinking during the invulnerability window. */
const BLINK_FADED_ALPHA = 0.3;
const BLINK_INTERVAL_MS = 100;

/**
 * Movement/traversal events Pedro emits on himself (he is a Phaser
 * EventEmitter). Planets opt in by listening; Pedro never knows who listens or
 * which world he is on. Discrete moments only — footstep cadence is left to the
 * scene, which can derive it from `isGrounded()` and the body velocity.
 */
export const PLAYER_EVENTS = {
  jump: "player:jump",
  land: "player:land",
} as const;

/**
 * Pedro. Owns input-driven movement, jumping, health, damage gating, and
 * blinking. Holds no planet-specific knowledge.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  readonly maxHealth: number = PLAYER_TUNING.maxHealth;

  private health: number = PLAYER_TUNING.maxHealth;
  private invulnerableUntil = 0;
  private controlEnabled = true;

  /**
   * Generic horizontal-speed scale, default 1 (no effect). A scene can lower it
   * for a careful/stealth walk or raise it for a sprint without Pedro knowing
   * why. Jump strength is deliberately unaffected.
   */
  private speedMultiplier = 1;

  private readonly keys: {
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
  };

  private readonly art: Phaser.GameObjects.Sprite;
  private readonly dust: Phaser.GameObjects.Particles.ParticleEmitter;
  private wasGrounded = false;
  private hurtUntil = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ASSET_KEYS.player);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setBounce(0);
    this.setVisible(false);
    (this.body as Phaser.Physics.Arcade.Body).setSize(BODY_SIZES.player.width, BODY_SIZES.player.height);
    this.art = scene.add.sprite(x, y, ASSET_KEYS.playerArt, 0)
      .setOrigin(0.5, PLAYER_FRAMES.baseline / PLAYER_FRAMES.height).setDepth(10);
    this.art.play(ANIMATIONS.idle);
    this.dust = scene.add.particles(0, 0, ASSET_KEYS.particle, {
      emitting: false, lifespan: 320, speedX: { min: -65, max: 65 },
      speedY: { min: -35, max: -8 }, gravityY: 110,
      scale: { start: 0.5, end: 0 }, alpha: { start: 0.4, end: 0 },
      tint: 0xc2a1de, maxParticles: 30,
    }).setDepth(9);
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncArt, this);

    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error("Player requires keyboard input to be available.");
    }
    this.keys = {
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      space: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };
  }

  update(time: number): void {
    this.updateBlink(time);

    const body = this.body as Phaser.Physics.Arcade.Body;

    if (!this.controlEnabled) {
      this.setVelocityX(0);
      return;
    }

    const leftHeld = this.keys.left.isDown || this.keys.a.isDown;
    const rightHeld = this.keys.right.isDown || this.keys.d.isDown;

    const speed = PLAYER_TUNING.moveSpeed * this.speedMultiplier;
    if (leftHeld === rightHeld) {
      // Neither held, or both held: no horizontal movement.
      this.setVelocityX(0);
    } else if (leftHeld) {
      this.setVelocityX(-speed);
    } else {
      this.setVelocityX(speed);
    }

    const onFloor = body.blocked.down || body.touching.down;
    if (Phaser.Input.Keyboard.JustDown(this.keys.space) && onFloor) {
      this.setVelocityY(PLAYER_TUNING.jumpVelocity);
      this.emit(PLAYER_EVENTS.jump, this.x, body.bottom);
    }
  }

  /** Generic movement-speed scale (1 = default). Does not affect jumping. */
  setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = Math.max(0, multiplier);
  }

  getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }

  /** True while the Arcade body rests on a surface. */
  isGrounded(): boolean {
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    return !!body && (body.blocked.down || body.touching.down);
  }

  /**
   * Applies one point of contact damage. Returns true only when damage was
   * actually applied (not dead, not within the invulnerability window).
   */
  takeDamage(time: number): boolean {
    if (this.isDead() || time < this.invulnerableUntil) {
      return false;
    }

    this.health = Math.max(0, this.health - 1);
    this.hurtUntil = time + 240;

    if (this.isDead()) {
      this.controlEnabled = false;
      this.setVelocityX(0);
      this.setAlpha(1);
      return true;
    }

    this.invulnerableUntil = time + PLAYER_TUNING.invulnerabilityMs;
    return true;
  }

  getHealth(): number {
    return this.health;
  }

  isDead(): boolean {
    return this.health <= 0;
  }

  destroy(fromScene?: boolean): void {
    this.scene?.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncArt, this);
    this.art?.destroy();
    this.dust?.destroy();
    super.destroy(fromScene);
  }

  private syncArt(): void {
    if (!this.active || !this.body) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onFloor = body.blocked.down || body.touching.down;
    this.art.setPosition(this.x, this.y + BODY_SIZES.player.height / 2).setAlpha(this.alpha);
    if (body.velocity.x !== 0) this.art.setFlipX(body.velocity.x < 0);
    const animation = this.scene.time.now < this.hurtUntil ? ANIMATIONS.hurt
      : !onFloor ? (body.velocity.y < 0 ? ANIMATIONS.jump : ANIMATIONS.fall)
      : Math.abs(body.velocity.x) > 1 ? ANIMATIONS.run : ANIMATIONS.idle;
    this.art.play(animation, true);
    this.art.setScale(1, animation === ANIMATIONS.idle ? 1 + Math.sin(this.scene.time.now / 480) * 0.009 : 1);
    if (onFloor && !this.wasGrounded) {
      this.dust.explode(7, this.x, body.bottom);
      this.emit(PLAYER_EVENTS.land, this.x, body.bottom);
    }
    this.wasGrounded = onFloor;
  }

  private updateBlink(time: number): void {
    if (time < this.invulnerableUntil) {
      const phase = Math.floor(time / BLINK_INTERVAL_MS) % 2;
      this.setAlpha(phase === 0 ? 1 : BLINK_FADED_ALPHA);
    } else if (this.alpha !== 1) {
      this.setAlpha(1);
    }
  }
}
