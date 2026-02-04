import { describe, expect, it } from 'vitest';
import { generateTilemap } from './tilemap-generator';

describe('tilemap generator', () => {
  it('creates border walls', () => {
    const map = generateTilemap(10, 10, 42);
    for (let x = 0; x < 10; x++) {
      expect(map[0][x]).toBe(2);
      expect(map[9][x]).toBe(2);
    }
    for (let y = 0; y < 10; y++) {
      expect(map[y][0]).toBe(2);
      expect(map[y][9]).toBe(2);
    }
  });

  it('keeps tiles within range', () => {
    const map = generateTilemap(8, 8, 7);
    map.forEach(row => row.forEach(tile => {
      expect(tile).toBeGreaterThanOrEqual(1);
      expect(tile).toBeLessThanOrEqual(5);
    }));
  });
});
