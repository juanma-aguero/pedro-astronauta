import Phaser from "phaser";
import { ASSET_KEYS } from "../../config/assetKeys";
import { Player, PLAYER_EVENTS } from "../../entities/Player";
import { Oscuro } from "../../entities/enemies/Oscuro";
import { NoiseSystem } from "../../mechanics/noise/NoiseSystem";
import { NoiseTrap } from "../../mechanics/noise/NoiseTrap";
import type { NoiseKind } from "../../mechanics/noise/noiseTypes";
import { silencioConfig } from "./silencioConfig";
import {
  SilencioArt, drawSilencioDecoration, drawSilencioSpaceship, drawSilencioTerrain,
} from "../../art/SilencioArt";
import { HealthHud } from "../../ui/HealthHud";
import { NoiseHud } from "../../ui/NoiseHud";
import type { LevelRunContext } from "../levelNavigation";

/** This phase's identity for the shared result screens. */
const RUN_CONTEXT: LevelRunContext = {
  worldId: "silencio",
  levelId: "phase-1",
  sceneKey: "SilencioScene",
};

/** Careful-walk speed as a fraction of Pedro's normal speed. */
const SLOW_WALK_MULTIPLIER = 0.45;

/** Silencio-local noise tuning. intensity 0..1, radius in world px. */
const NOISE_PROFILE: Record<"slowStep" | "step" | NoiseKind, { intensity: number; radius: number }> = {
  slowStep: { intensity: 0.15, radius: 105 },
  step: { intensity: 0.45, radius: 290 },
  footstep: { intensity: 0.45, radius: 290 },
  jump: { intensity: 0.55, radius: 350 },
  landing: { intensity: 0.85, radius: 540 },
  environment: { intensity: 1, radius: 720 },
};

const STEP_CADENCE_NORMAL_MS = 340;
const STEP_CADENCE_SLOW_MS = 560;

/** Noise emitted in the first moments after (re)start is ignored (spawn drop). */
const NOISE_GRACE_MS = 700;

export class SilencioScene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private oscuros!: Phaser.Physics.Arcade.Group;
  private traps: NoiseTrap[] = [];
  private clueSprite!: Phaser.Physics.Arcade.Image;
  private hud!: HealthHud;
  private noiseHud!: NoiseHud;
  private scenery!: SilencioArt;
  private noise!: NoiseSystem;

  private shiftKey!: Phaser.Input.Keyboard.Key;
  private lastStepAt = 0;
  private startedAt = 0;
  private transitioning = false;

  constructor() {
    super("SilencioScene");
  }

  create(): void {
    this.transitioning = false;
    this.traps = [];
    this.startedAt = this.time.now;
    const { world } = silencioConfig;

    // 1-2. World bounds + scenery.
    this.physics.world.setBounds(0, 0, world.width, world.height);
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.scenery = new SilencioArt(this);
    for (const deco of silencioConfig.decorations) {
      drawSilencioDecoration(this, deco.kind, deco.x, deco.y, deco.scale);
    }

    // 3. Platforms.
    this.platforms = this.physics.add.staticGroup();
    for (const cfg of silencioConfig.platforms) {
      const tile = this.platforms.create(cfg.x, cfg.y, ASSET_KEYS.platform) as Phaser.Physics.Arcade.Image;
      tile.setDisplaySize(cfg.width, cfg.height);
      tile.refreshBody();
      tile.setVisible(false);
      drawSilencioTerrain(this, cfg);
    }

    // 4. Spaceship.
    drawSilencioSpaceship(this, silencioConfig.spaceship.x, 642);

    // 5. Clue.
    this.clueSprite = this.physics.add.staticImage(silencioConfig.clue.x, silencioConfig.clue.y, ASSET_KEYS.clue);
    this.clueSprite.setVisible(false);
    const clueArt = this.add.image(silencioConfig.clue.x, silencioConfig.clue.y, ASSET_KEYS.clueIcon).setDisplaySize(56, 56).setDepth(5);
    this.tweens.add({ targets: clueArt, y: clueArt.y - 9, duration: 1500, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.add.particles(silencioConfig.clue.x, silencioConfig.clue.y, ASSET_KEYS.particle, {
      lifespan: 1000, frequency: 200, speedY: { min: -22, max: -8 },
      speedX: { min: -12, max: 12 }, scale: { start: 0.3, end: 0 },
      alpha: { start: 0.7, end: 0 }, tint: 0x8ff0ea, maxParticles: 12,
    }).setDepth(4);

    // 6. Pedro.
    this.player = new Player(this, silencioConfig.playerSpawn.x, silencioConfig.playerSpawn.y);

    // 7. Noise system.
    this.noise = new NoiseSystem();

    // 8. Oscuros — each one listens to the noise system.
    this.oscuros = this.physics.add.group();
    const targetProvider = () => ({ x: this.player.x, y: this.player.y });
    for (const cfg of silencioConfig.enemies) {
      const oscuro = new Oscuro(this, cfg, targetProvider);
      this.noise.addListener(oscuro);
      this.oscuros.add(oscuro);
    }

    // 9. Environmental noise traps.
    for (const cfg of silencioConfig.noiseTraps) {
      this.traps.push(new NoiseTrap(this, cfg, this.noise));
    }

    // 10-11. Colliders + damage / trigger / clue overlaps.
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.oscuros, this.platforms);
    this.physics.add.overlap(this.player, this.oscuros, this.handleOscuroOverlap, undefined, this);
    if (this.traps.length > 0) {
      this.physics.add.overlap(this.player, this.traps, this.handleTrapOverlap, undefined, this);
    }
    this.physics.add.overlap(this.player, this.clueSprite, this.handleClueOverlap, undefined, this);

    // 12-13. HUDs. Silencio shows both VIDA and RUIDO.
    this.hud = new HealthHud(this, this.player.maxHealth);
    this.hud.refresh(this.player.getHealth());
    this.noiseHud = new NoiseHud(this);

    // 14. Camera.
    this.cameras.main.setBounds(0, 0, world.width, world.height);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setFollowOffset(-120, 0);

    // 15. Stealth-walk key + Pedro's traversal events -> noise.
    this.shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.player.on(PLAYER_EVENTS.jump, (x: number, y: number) => this.emitNoise("jump", x, y));
    this.player.on(PLAYER_EVENTS.land, (x: number, y: number) => this.emitNoise("landing", x, y));

    this.showArrivalMessage();
  }

  update(time: number, deltaMs: number): void {
    const slow = this.shiftKey.isDown;
    this.player.setSpeedMultiplier(slow ? SLOW_WALK_MULTIPLIER : 1);
    this.player.update(time);

    this.emitFootsteps(time, slow);

    this.scenery.update();
    this.noise.update(time, deltaMs);
    for (const oscuro of this.oscuros.getChildren()) {
      (oscuro as Oscuro).update(time);
    }
    this.noiseHud.refresh(this.noise.getMeter());

    if (!this.transitioning && this.player.y > silencioConfig.world.voidY) {
      this.transitioning = true;
      this.scene.restart();
    }
  }

  /** Footsteps: only while grounded and actually moving, on a cadence. */
  private emitFootsteps(time: number, slow: boolean): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const moving = this.player.isGrounded() && Math.abs(body.velocity.x) > 5;
    if (!moving) return;
    const cadence = slow ? STEP_CADENCE_SLOW_MS : STEP_CADENCE_NORMAL_MS;
    if (time - this.lastStepAt < cadence) return;
    this.lastStepAt = time;
    this.emitNoise(slow ? "slowStep" : "step", this.player.x, body.bottom);
  }

  private emitNoise(kind: "slowStep" | "step" | NoiseKind, x: number, y: number): void {
    if (this.transitioning) return;
    if (this.time.now < this.startedAt + NOISE_GRACE_MS) return;
    const profile = NOISE_PROFILE[kind];
    const noiseKind: NoiseKind = kind === "slowStep" || kind === "step" ? "footstep" : kind;
    this.noise.emit({ x, y, kind: noiseKind, intensity: profile.intensity, radius: profile.radius }, this.time.now);
    this.spawnPulse(x, y, profile.radius, profile.intensity);
  }

  /** World-space ring roughly the size of the hearing radius. Subtle. */
  private spawnPulse(x: number, y: number, radius: number, intensity: number): void {
    if (intensity < 0.2) {
      // Slow walk: barely perceptible.
      const dot = this.add.image(x, y, ASSET_KEYS.silencioNoiseRing)
        .setTint(0x8ff0ea).setBlendMode(Phaser.BlendModes.ADD).setDepth(6).setScale(0.5).setAlpha(0.12);
      this.tweens.add({ targets: dot, scale: 1.4, alpha: 0, duration: 320, onComplete: () => dot.destroy() });
      return;
    }
    const ring = this.add.image(x, y, ASSET_KEYS.silencioNoiseRing)
      .setTint(intensity >= 0.8 ? 0xffca66 : 0x8ff0ea)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(6)
      .setScale(0.3).setAlpha(Phaser.Math.Clamp(0.15 + intensity * 0.35, 0.15, 0.5));
    this.tweens.add({
      targets: ring, scale: radius / 32, alpha: 0,
      duration: 380 + intensity * 260, ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
  }

  private showArrivalMessage(): void {
    const cx = this.cameras.main.width / 2;
    const line1 = this.add.text(cx, 96, "EN SILENCIO, EL RUIDO TE DELATA", {
      fontFamily: "Trebuchet MS, sans-serif", fontSize: "22px", fontStyle: "bold",
      color: "#dfeffb", stroke: "#05070d", strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(900);
    const line2 = this.add.text(cx, 128, "SHIFT + MOVERSE: CAMINAR DESPACIO", {
      fontFamily: "Trebuchet MS, sans-serif", fontSize: "17px",
      color: "#8ff0ea", stroke: "#05070d", strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(900);
    this.tweens.add({ targets: [line1, line2], alpha: 0, delay: 4600, duration: 1200, onComplete: () => { line1.destroy(); line2.destroy(); } });
  }

  private handleOscuroOverlap: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = () => {
    if (this.transitioning) return;
    if (!this.player.takeDamage(this.time.now)) return;
    this.hud.refresh(this.player.getHealth());
    if (this.player.isDead()) {
      this.transitioning = true;
      this.scene.start("GameOverScene", RUN_CONTEXT);
    }
  };

  private handleTrapOverlap: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_player, trap) => {
    if (this.transitioning) return;
    (trap as unknown as NoiseTrap).trigger(this.time.now);
  };

  private handleClueOverlap: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = () => {
    if (this.transitioning) return;
    this.transitioning = true;
    this.scene.start("LevelCompleteScene", RUN_CONTEXT);
  };
}
