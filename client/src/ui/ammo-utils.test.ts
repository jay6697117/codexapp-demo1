import { describe, expect, it } from 'vitest';
import { formatAmmoText, getAmmoPercent } from './ammo-utils';

describe('ammo utils', () => {
  it('formats ammo text', () => {
    expect(formatAmmoText(12, 30)).toBe('12 / 30');
  });

  it('computes ammo percent safely', () => {
    expect(getAmmoPercent(0, 30)).toBe(0);
    expect(getAmmoPercent(15, 30)).toBe(0.5);
    expect(getAmmoPercent(40, 30)).toBe(1);
  });
});
