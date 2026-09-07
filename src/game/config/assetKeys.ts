/** Physics textures and illustrated textures deliberately have separate keys. */
export const ASSET_KEYS = {
  player: "pedro-body",
  blueMonster: "worm-body",
  platform: "terrain-body",
  clue: "clue-body",
  playerArt: "pedro-art",
  monsterArt: "worm-art",
  props: "satenes-props",
  terrain: "satenes-terrain",
  sky: "satenes-sky",
  ridges: "satenes-ridges",
  spaceship: "satenes-props",
  particle: "dust-particle",
} as const;

export type AssetKey = (typeof ASSET_KEYS)[keyof typeof ASSET_KEYS];
