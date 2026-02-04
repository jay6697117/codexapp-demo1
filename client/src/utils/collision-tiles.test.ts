import { describe, expect, it } from 'vitest';
import { TILES } from '@pixel-arena/shared';
import { getCollidableTileIds } from './collision-tiles';

describe('getCollidableTileIds', () => {
  it('includes wall, water, and fence tiles', () => {
    const ids = getCollidableTileIds();
    expect(ids).toContain(TILES.WALL);
    expect(ids).toContain(TILES.WATER);
    expect(ids).toContain(TILES.FENCE);
  });

  it('excludes non-collidable tiles', () => {
    const ids = getCollidableTileIds();
    expect(ids).not.toContain(TILES.GRASS);
    expect(ids).not.toContain(TILES.FLOWER);
    expect(ids).not.toContain(TILES.EMPTY);
  });
});
