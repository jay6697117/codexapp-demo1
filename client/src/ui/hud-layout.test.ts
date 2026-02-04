import { describe, it, expect } from 'vitest';
import { calculateHudLayout } from './hud-layout';

type Rect = { x: number; y: number; width: number; height: number };

function overlaps(a: Rect, b: Rect): boolean {
  const ax2 = a.x + a.width;
  const ay2 = a.y + a.height;
  const bx2 = b.x + b.width;
  const by2 = b.y + b.height;
  return a.x < bx2 && ax2 > b.x && a.y < by2 && ay2 > b.y;
}

describe('calculateHudLayout', () => {
  it('positions minimap at top-right and avoids overlap with top info bar', () => {
    const layout = calculateHudLayout({ screenWidth: 800, screenHeight: 600 });
    expect(layout.minimap.x).toBeGreaterThan(0);
    expect(layout.minimap.y).toBeGreaterThanOrEqual(0);

    expect(overlaps(layout.minimap, layout.topInfoBar)).toBe(false);
  });

  it('keeps minimap away from ammo box at bottom-right', () => {
    const layout = calculateHudLayout({ screenWidth: 800, screenHeight: 600 });
    expect(overlaps(layout.minimap, layout.ammoBox)).toBe(false);
  });

  it('keeps hp bar and top info bar from overlapping', () => {
    const layout = calculateHudLayout({ screenWidth: 800, screenHeight: 600 });
    expect(overlaps(layout.hpBar, layout.topInfoBar)).toBe(false);
  });

  it('hides top info bar when screen is too narrow', () => {
    const layout = calculateHudLayout({ screenWidth: 360, screenHeight: 640 });
    expect(layout.topInfoBar.width).toBe(0);
  });
});
