import Phaser from "phaser";
import { ASSET_KEYS } from "../config/assetKeys";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/gameConfig";

/**
 * Generic deep-space backdrop for the menu and result screens. Owned by no
 * planet: it is procedural so it never depends on planet artwork.
 */
export function menuBackdrop(scene: Phaser.Scene): void {
  const sky = scene.add.graphics().setScrollFactor(0).setDepth(-100);
  const gradient = [
    [0x05070f, 0.0], [0x0a1024, 0.45], [0x141a33, 0.8], [0x241a30, 1.0],
  ] as const;
  for (let i = 0; i < gradient.length - 1; i++) {
    const [color] = gradient[i];
    sky.fillStyle(color, 1).fillRect(0, GAME_HEIGHT * gradient[i][1], GAME_WIDTH, GAME_HEIGHT * (gradient[i + 1][1] - gradient[i][1]) + 1);
  }

  // Distant planets.
  scene.add.circle(1030, 150, 92, 0x3b4a7a, 0.9).setScrollFactor(0).setDepth(-95);
  scene.add.circle(1002, 132, 92, 0x59689c, 0.35).setScrollFactor(0).setDepth(-94);
  scene.add.circle(210, 470, 40, 0x6a4a72, 0.5).setScrollFactor(0).setDepth(-95);

  // Twinkling star field.
  for (let i = 0; i < 60; i++) {
    const x = (i * 197 + 61) % GAME_WIDTH;
    const y = (i * 313 + 29) % GAME_HEIGHT;
    const star = scene.add.image(x, y, ASSET_KEYS.particle)
      .setScale(i % 5 === 0 ? 0.4 : 0.16).setScrollFactor(0).setDepth(-90).setAlpha(0.35);
    scene.tweens.add({
      targets: star, alpha: 0.9, scale: star.scaleX * 1.6,
      duration: 1400 + i * 91, delay: i * 63, yoyo: true, repeat: -1,
    });
  }

  scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x05060f, 0.28).setScrollFactor(0).setDepth(-80);
}
