import { describe, it, expect } from 'vitest';
import { shouldAutoStartGame } from './auto-start';

describe('shouldAutoStartGame', () => {
  it('returns true only when flag is "true"', () => {
    expect(shouldAutoStartGame('true', '')).toBe(true);
    expect(shouldAutoStartGame('false', '')).toBe(false);
    expect(shouldAutoStartGame(undefined, '')).toBe(false);
    expect(shouldAutoStartGame('TRUE', '')).toBe(false);
  });

  it('returns true when query string has autostart=1', () => {
    expect(shouldAutoStartGame(undefined, '?autostart=1')).toBe(true);
    expect(shouldAutoStartGame('false', '?autostart=1')).toBe(true);
    expect(shouldAutoStartGame(undefined, '?autostart=0')).toBe(false);
  });
});
