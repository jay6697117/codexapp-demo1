import { describe, expect, it } from 'vitest';
import { getHealthPercent, isLowHealth } from './health-bar-utils';

describe('health bar utils', () => {
  it('calculates health percent safely', () => {
    expect(getHealthPercent(50, 100)).toBe(0.5);
    expect(getHealthPercent(0, 100)).toBe(0);
    expect(getHealthPercent(150, 100)).toBe(1);
  });

  it('flags low health at or below 25%', () => {
    expect(isLowHealth(0.25)).toBe(true);
    expect(isLowHealth(0.26)).toBe(false);
  });
});
