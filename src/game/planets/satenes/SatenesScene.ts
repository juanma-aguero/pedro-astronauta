import Phaser from "phaser";
import { ASSET_KEYS } from "../../config/assetKeys";
import { Player } from "../../entities/Player";
import { BlueMonster } from "../../entities/enemies/BlueMonster";
import { satenesConfig } from "./satenesConfig";
import { SatenesArt, addPlant, drawTerrain } from "../../art/SatenesArt";
import { HealthHud } from "../../ui/HealthHud";

export class SatenesScene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private monsters!: Phaser.Physics.Arcade.Group;
  private clueSprite!: Phaser.Physics.Arcade.Image;
  private hud!: HealthHud;
  private scenery!: SatenesArt;

  /** Guards scene flow so one physics frame cannot transition twice. */
  private transitioning = false;

  constructor() {
    super("SatenesScene");
  }

  create(): void {
    this.transitioning = false;

    const { world } = satenesConfig;

    // 1. Physics and world bounds. The bottom edge does not collide, so Pedro
    //    can fall through pits while the left/right/top edges still contain him.
    this.physics.world.setBounds(0, 0, world.width, world.height);
    this.physics.world.setBoundsCollision(true, true, true, false);

    // 2. Background and decorations.
    this.scenery = new SatenesArt(this);
    this.drawDecorations();

    // 3. Static platforms from configuration.
    this.platforms = this.physics.add.staticGroup();
    for (const cfg of satenesConfig.platforms) {
      const tile = this.platforms.create(
        cfg.x,
        cfg.y,
        ASSET_KEYS.platform,
      ) as Phaser.Physics.Arcade.Image;
      tile.setDisplaySize(cfg.width, cfg.height);
      tile.refreshBody();
      tile.setVisible(false);
      drawTerrain(this, cfg);
    }

    // 4. Decorative art is independent of overlap and collision bodies.
    this.add
      .image(satenesConfig.spaceship.x, 641, ASSET_KEYS.props, "rocket")
      .setOrigin(0.5, 1).setDisplaySize(180, 254).setDepth(-1);

    this.clueSprite = this.physics.add.staticImage(
      satenesConfig.clue.x,
      satenesConfig.clue.y,
      ASSET_KEYS.clue,
    );
    this.clueSprite.setVisible(false);
    const clueArt = this.add.image(satenesConfig.clue.x, satenesConfig.clue.y, ASSET_KEYS.props, "clue").setDisplaySize(72, 66).setDepth(5);
    this.tweens.add({ targets: clueArt, y: clueArt.y - 9, duration: 1500, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.add.particles(satenesConfig.clue.x, satenesConfig.clue.y, ASSET_KEYS.particle, {
      lifespan: 900, frequency: 180, speedY: { min: -25, max: -10 },
      speedX: { min: -15, max: 15 }, scale: { start: 0.3, end: 0 },
      alpha: { start: 0.8, end: 0 }, tint: 0xffdc7c, maxParticles: 12,
    }).setDepth(4);
    this.add
      .text(satenesConfig.clue.x, satenesConfig.clue.y - 57, "?", {
        fontFamily: "Trebuchet MS, sans-serif", fontSize: "23px",
        color: "#ffe8a4", fontStyle: "bold", stroke: "#382347", strokeThickness: 4,
      })
      .setOrigin(0.5);

    // 5. Pedro at the configured spawn.
    this.player = new Player(
      this,
      satenesConfig.playerSpawn.x,
      satenesConfig.playerSpawn.y,
    );

    // 6. Every Blue Monster from its configuration.
    this.monsters = this.physics.add.group();
    const targetProvider = () => ({ x: this.player.x, y: this.player.y });
    for (const enemyCfg of satenesConfig.enemies) {
      const monster = new BlueMonster(this, enemyCfg, targetProvider);
      this.monsters.add(monster);
    }

    // 7. Player/platform and monster/platform colliders.
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.monsters, this.platforms);

    // 8. Player/monster and player/clue overlaps.
    this.physics.add.overlap(
      this.player,
      this.monsters,
      this.handleMonsterOverlap,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.clueSprite,
      this.handleClueOverlap,
      undefined,
      this,
    );

    // 9. Screen-fixed HUD.
    this.hud = new HealthHud(this, this.player.maxHealth);
    this.refreshHud();

    // 10. Camera follows Pedro and stays inside the world bounds.
    this.cameras.main.setBounds(0, 0, world.width, world.height);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setFollowOffset(-120, 0);
  }

  update(time: number): void {
    this.player.update(time);
    this.scenery.update();

    for (const monster of this.monsters.getChildren()) {
      (monster as BlueMonster).update();
    }

    // Falling into a pit: restart immediately, no Game Over, no health loss.
    if (!this.transitioning && this.player.y > satenesConfig.world.voidY) {
      this.transitioning = true;
      this.scene.restart();
    }
  }

  private handleMonsterOverlap: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback =
    () => {
      if (this.transitioning) {
        return;
      }

      const damaged = this.player.takeDamage(this.time.now);
      if (!damaged) {
        return;
      }

      this.refreshHud();

      if (this.player.isDead()) {
        this.transitioning = true;
        this.scene.start("GameOverScene");
      }
    };

  private handleClueOverlap: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback =
    () => {
      if (this.transitioning) {
        return;
      }
      this.transitioning = true;
      this.scene.start("LevelCompleteScene");
    };

  private refreshHud(): void {
    this.hud.refresh(this.player.getHealth());
  }

  private drawDecorations(): void {
    for (const deco of satenesConfig.decorations) {
      if (deco.kind === "star") continue;
      if (deco.kind === "rock") {
        this.add.image(deco.x, 641, ASSET_KEYS.props, "rocks").setOrigin(0.5, 1)
          .setDisplaySize(58, 31).setDepth(-2).setAlpha(0.9);
      } else {
        addPlant(this, deco.x + 70, 642, 42);
      }
    }
    for (const ground of satenesConfig.platforms.filter(platform => platform.height >= 60)) {
      addPlant(this, ground.x - ground.width / 2 + 30, 642, 64);
      addPlant(this, ground.x + ground.width / 2 - 38, 642, 48);
    }
  }
}
