import { describe, expect, it } from 'vitest';
import { formatAliveText, formatZoneTimer } from './top-info-utils';

describe('top info utils', () => {
  it('formats alive text', () => {
    expect(formatAliveText(12, 20)).toBe('ALIVE 12/20');
  });

  it('formats zone timer', () => {
    expect(formatZoneTimer(32000)).toBe('RING 32s');
    expect(formatZoneTimer(0)).toBe('FINAL');
  });
});
