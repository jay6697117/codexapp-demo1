import { describe, expect, it } from 'vitest';
import { getMinimapTransform, worldToMinimap } from './minimap-utils';

describe('minimap utils', () => {
  it('computes transform for non-square maps', () => {
    const transform = getMinimapTransform(1000, 500, 100);
    expect(transform.scale).toBe(0.1);
    expect(transform.displayWidth).toBe(100);
    expect(transform.displayHeight).toBe(50);
    expect(transform.offsetX).toBe(0);
    expect(transform.offsetY).toBe(25);
  });

  it('maps world coordinates to minimap', () => {
    const transform = getMinimapTransform(1000, 500, 100);
    const point = worldToMinimap(200, 250, transform);
    expect(point.x).toBe(20);
    expect(point.y).toBe(50);
  });
});
