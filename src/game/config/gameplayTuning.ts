/**
 * Pedro's shared movement and health defaults.
 *
 * These are starting values and may be adjusted during the final tuning
 * milestone if manual playtesting shows the layout is frustrating or cannot
 * meet the intended traversal time.
 */
export const PLAYER_TUNING = {
  moveSpeed: 260,
  jumpVelocity: -650,
  maxHealth: 3,
  invulnerabilityMs: 1000,
} as const;
