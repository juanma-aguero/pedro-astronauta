/**
 * "Noise" is gameplay data only — there is no audio. A NoiseEvent is a point in
 * the world with a loudness (`intensity`, 0..1) and how far it carries
 * (`radius`, world pixels). Anything that wants to react to sound implements
 * `NoiseListener` and registers with the `NoiseSystem`.
 */

export type NoiseKind = "footstep" | "jump" | "landing" | "environment";

export interface NoiseEvent {
  x: number;
  y: number;
  kind: NoiseKind;
  /** 0..1. Drives the HUD meter and the loud/quiet reaction threshold. */
  intensity: number;
  /** World-space hearing radius. A listener hears the event only within it. */
  radius: number;
  /** Scene time (ms) when the noise happened. */
  timestamp: number;
}

export interface NoiseListener {
  onNoise(event: NoiseEvent): void;
}

/** True when a listener at (x, y) is close enough to hear `event`. */
export function isWithinEarshot(
  x: number,
  y: number,
  event: NoiseEvent,
  hearingMultiplier = 1,
): boolean {
  const dx = x - event.x;
  const dy = y - event.y;
  const range = event.radius * hearingMultiplier;
  return dx * dx + dy * dy <= range * range;
}
