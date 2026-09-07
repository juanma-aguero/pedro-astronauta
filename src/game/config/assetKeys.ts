/**
 * Texture keys. Physics bodies and illustrated art deliberately have separate
 * keys, and every planet-owned texture is namespaced so ownership is obvious at
 * the call site. Shared keys (player, platform, clue, particle, heart) belong to
 * no single planet.
 */
export const ASSET_KEYS = {
  // Shared physics / UI textures.
  player: "pedro-body",
  playerArt: "pedro-art",
  platform: "platform-body",
  clue: "clue-body",
  particle: "spark-particle",
  heart: "hud-heart",
  clueIcon: "clue-icon",

  // Satenes.
  satenesMonsterBody: "satenes-monster-body",
  satenesMonsterArt: "satenes-monster-art",
  satenesProps: "satenes-props",
  satenesTerrain: "satenes-terrain",
  satenesSky: "satenes-sky",
  satenesRidges: "satenes-ridges",

  // Pinos.
  pinosPlushBody: "pinos-plush-body",
  pinosPlushArt: "pinos-plush-art",
  pinosProps: "pinos-props",
  pinosTerrain: "pinos-terrain",
  pinosSky: "pinos-sky",
  pinosRidges: "pinos-ridges",

  // Silencio.
  silencioOscuroBody: "silencio-oscuro-body",
  silencioOscuroArt: "silencio-oscuro-art",
  silencioProps: "silencio-props",
  silencioTerrain: "silencio-terrain",
  silencioSky: "silencio-sky",
  silencioRidges: "silencio-ridges",
  silencioNoiseRing: "silencio-noise-ring",
} as const;

export type AssetKey = (typeof ASSET_KEYS)[keyof typeof ASSET_KEYS];
