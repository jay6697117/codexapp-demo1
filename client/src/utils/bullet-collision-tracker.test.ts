import { describe, it, expect } from 'vitest';
import { BulletCollisionTracker } from './bullet-collision-tracker';

describe('BulletCollisionTracker', () => {
  it('records hits and active bullet counts', () => {
    const tracker = new BulletCollisionTracker();
    expect(tracker.getStats()).toEqual({ hits: 0, active: 0 });

    tracker.setActive(3);
    tracker.recordHit();
    tracker.recordHit();

    expect(tracker.getStats()).toEqual({ hits: 2, active: 3 });
  });

  it('resets counters', () => {
    const tracker = new BulletCollisionTracker();
    tracker.setActive(5);
    tracker.recordHit();
    tracker.reset();
    expect(tracker.getStats()).toEqual({ hits: 0, active: 0 });
  });
});
