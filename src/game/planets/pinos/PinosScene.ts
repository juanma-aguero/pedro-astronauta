import Phaser from "phaser";
import { ASSET_KEYS } from "../../config/assetKeys";
import { Player } from "../../entities/Player";
import { HeavyMetalPlush } from "../../entities/enemies/HeavyMetalPlush";
import { pinosConfig } from "./pinosConfig";
import {
  PinosArt, drawPinosDecoration, drawPinosSpaceship, drawPinosTerrain,
} from "../../art/PinosArt";
import { HealthHud } from "../../ui/HealthHud";
import type { LevelRunContext } from "../levelNavigation";

/** This phase's identity for the shared result screens. */
const RUN_CONTEXT: LevelRunContext = {
  worldId: "pinos",
  levelId: "phase-1",
  sceneKey: "PinosScene",
};

export class PinosScene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private plushes!: Phaser.Physics.Arcade.Group;
  private clueSprite!: Phaser.Physics.Arcade.Image;
  private hud!: HealthHud;
  private scenery!: PinosArt;

  /** Guards scene flow so one physics frame cannot transition twice. */
  private transitioning = false;

  constructor() {
    super("PinosScene");
  }

  create(): void {
    this.transitioning = false;
    const { world } = pinosConfig;

    // 1. World bounds. The bottom edge does not collide so Pedro falls in pits.
    this.physics.world.setBounds(0, 0, world.width, world.height);
    this.physics.world.setBoundsCollision(true, true, true, false);

    // 2. Background scenery.
    this.scenery = new PinosArt(this);
    for (const deco of pinosConfig.decorations) {
      drawPinosDecoration(this, deco.kind, deco.x, deco.y, deco.scale);
    }

    // 3. Static platforms from configuration.
    this.platforms = this.physics.add.staticGroup();
    for (const cfg of pinosConfig.platforms) {
      const tile = this.platforms.create(cfg.x, cfg.y, ASSET_KEYS.platform) as Phaser.Physics.Arcade.Image;
      tile.setDisplaySize(cfg.width, cfg.height);
      tile.refreshBody();
      tile.setVisible(false);
      drawPinosTerrain(this, cfg);
    }

    // 4. Spaceship (decorative).
    drawPinosSpaceship(this, pinosConfig.spaceship.x, 642);

    // 5. Clue near the far right.
    this.clueSprite = this.physics.add.staticImage(pinosConfig.clue.x, pinosConfig.clue.y, ASSET_KEYS.clue);
    this.clueSprite.setVisible(false);
    const clueArt = this.add.image(pinosConfig.clue.x, pinosConfig.clue.y, ASSET_KEYS.clueIcon).setDisplaySize(56, 56).setDepth(5);
    this.tweens.add({ targets: clueArt, y: clueArt.y - 9, duration: 1500, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.add.particles(pinosConfig.clue.x, pinosConfig.clue.y, ASSET_KEYS.particle, {
      lifespan: 900, frequency: 180, speedY: { min: -25, max: -10 },
      speedX: { min: -15, max: 15 }, scale: { start: 0.3, end: 0 },
      alpha: { start: 0.8, end: 0 }, tint: 0x49d5e0, maxParticles: 12,
    }).setDepth(4);
    this.add
      .text(pinosConfig.clue.x, pinosConfig.clue.y - 52, "?", {
        fontFamily: "Trebuchet MS, sans-serif", fontSize: "23px",
        color: "#d4f7fa", fontStyle: "bold", stroke: "#16302f", strokeThickness: 4,
      })
      .setOrigin(0.5);

    // 6. Pedro at the configured spawn.
    this.player = new Player(this, pinosConfig.playerSpawn.x, pinosConfig.playerSpawn.y);

    // 7. Every Heavy Metal Plush from its configuration.
    this.plushes = this.physics.add.group();
    const targetProvider = () => ({ x: this.player.x, y: this.player.y });
    for (const enemyCfg of pinosConfig.enemies) {
      this.plushes.add(new HeavyMetalPlush(this, enemyCfg, targetProvider));
    }

    // 8. Colliders.
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.plushes, this.platforms);

    // 9. Overlaps.
    this.physics.add.overlap(this.player, this.plushes, this.handlePlushOverlap, undefined, this);
    this.physics.add.overlap(this.player, this.clueSprite, this.handleClueOverlap, undefined, this);

    // 10. Screen-fixed HUD.
    this.hud = new HealthHud(this, this.player.maxHealth);
    this.refreshHud();

    // 11. Camera.
    this.cameras.main.setBounds(0, 0, world.width, world.height);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setFollowOffset(-120, 0);
  }

  update(time: number): void {
    this.player.update(time);
    this.scenery.update();

    for (const plush of this.plushes.getChildren()) {
      (plush as HeavyMetalPlush).update(time);
    }

    // 12. Falling into a pit: restart immediately, no Game Over, no health loss.
    if (!this.transitioning && this.player.y > pinosConfig.world.voidY) {
      this.transitioning = true;
      this.scene.restart();
    }
  }

  private handlePlushOverlap: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = () => {
    if (this.transitioning) return;

    const damaged = this.player.takeDamage(this.time.now);
    if (!damaged) return;

    this.refreshHud();

    if (this.player.isDead()) {
      this.transitioning = true;
      this.scene.start("GameOverScene", RUN_CONTEXT);
    }
  };

  private handleClueOverlap: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = () => {
    if (this.transitioning) return;
    this.transitioning = true;
    this.scene.start("LevelCompleteScene", RUN_CONTEXT);
  };

  private refreshHud(): void {
    this.hud.refresh(this.player.getHealth());
  }
}
