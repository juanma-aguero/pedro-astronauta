import type { NoiseEvent, NoiseKind, NoiseListener } from "./noiseTypes";

/** How long (ms) the HUD meter takes to fall from full to zero. */
const METER_DECAY_MS = 1100;

/** Events older than this (ms) are dropped so nothing accumulates forever. */
const EVENT_RETENTION_MS = 4000;

export interface NoiseEmitInput {
  x: number;
  y: number;
  kind: NoiseKind;
  intensity: number;
  radius: number;
}

/**
 * A tiny, framework-free gameplay mechanic. It broadcasts noise events to
 * registered listeners (the Oscuros), keeps a short-lived list of recent events
 * for inspection/debugging, and tracks a single decaying "how loud is it right
 * now" value for the HUD.
 *
 * No Phaser, no audio — deliberately unit-testable on its own.
 */
export class NoiseSystem {
  private readonly listeners = new Set<NoiseListener>();
  private recent: NoiseEvent[] = [];
  private meter = 0;
  private lastEvent: NoiseEvent | null = null;

  addListener(listener: NoiseListener): void {
    this.listeners.add(listener);
  }

  removeListener(listener: NoiseListener): void {
    this.listeners.delete(listener);
  }

  /** Emits one noise event: records it, bumps the meter, notifies listeners. */
  emit(input: NoiseEmitInput, now: number): NoiseEvent {
    const event: NoiseEvent = { ...input, timestamp: now };
    this.lastEvent = event;
    this.recent.push(event);
    this.meter = Math.min(1, Math.max(this.meter, event.intensity));
    for (const listener of this.listeners) listener.onNoise(event);
    return event;
  }

  /** Advance decay and prune stale events. Call once per scene update. */
  update(now: number, deltaMs: number): void {
    if (this.meter > 0) {
      this.meter = Math.max(0, this.meter - deltaMs / METER_DECAY_MS);
    }
    if (this.recent.length > 0) {
      this.recent = this.recent.filter((e) => now - e.timestamp <= EVENT_RETENTION_MS);
    }
  }

  /** Current loudness, 0..1, for UI feedback. */
  getMeter(): number {
    return this.meter;
  }

  /** The most recent event, or null if none has been emitted yet. */
  getLastEvent(): NoiseEvent | null {
    return this.lastEvent;
  }

  getRecentEvents(): readonly NoiseEvent[] {
    return this.recent;
  }

  /** Forget everything (used on scene restart). */
  reset(): void {
    this.listeners.clear();
    this.recent = [];
    this.meter = 0;
    this.lastEvent = null;
  }
}
