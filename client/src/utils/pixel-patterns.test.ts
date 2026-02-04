import { describe, expect, it } from 'vitest';
import { CHARACTER_PATTERNS, ITEM_PATTERNS, TILE_PATTERNS } from './pixel-patterns';

function expectPatternSize(pattern: string[], size: number) {
  expect(pattern.length).toBe(size);
  pattern.forEach(row => expect(row.length).toBe(size));
}

describe('pixel patterns', () => {
  it('character patterns are 16x16', () => {
    Object.values(CHARACTER_PATTERNS).forEach(pattern => expectPatternSize(pattern, 16));
  });

  it('item patterns are 16x16', () => {
    Object.values(ITEM_PATTERNS).forEach(pattern => expectPatternSize(pattern, 16));
  });

  it('tile patterns are 16x16', () => {
    Object.values(TILE_PATTERNS).forEach(pattern => expectPatternSize(pattern, 16));
  });
});
