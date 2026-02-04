import { TILES, isCollidable } from '@pixel-arena/shared';

export function getCollidableTileIds(): number[] {
  const values = Object.values(TILES).filter((value): value is number => typeof value === 'number');
  return values.filter((value) => isCollidable(value));
}
