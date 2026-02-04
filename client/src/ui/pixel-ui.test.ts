import { describe, expect, it } from 'vitest';
import { clampPercent, getNumericTextStyle, getPixelTextStyle, PIXEL_FONTS } from './pixel-ui';

describe('pixel-ui helpers', () => {
  it('clamps percent values', () => {
    expect(clampPercent(1.5)).toBe(1);
    expect(clampPercent(-0.2)).toBe(0);
    expect(clampPercent(0.4)).toBe(0.4);
  });

  it('builds UI text styles with the pixel font', () => {
    const style = getPixelTextStyle(14, '#ffffff');
    expect(style.fontFamily).toBe(PIXEL_FONTS.ui);
    expect(style.color).toBe('#ffffff');
    expect(style.fontSize).toBe('14px');
  });

  it('builds numeric text styles with the numeric font', () => {
    const style = getNumericTextStyle(18, '#ff0000');
    expect(style.fontFamily).toBe(PIXEL_FONTS.numbers);
    expect(style.color).toBe('#ff0000');
    expect(style.fontSize).toBe('18px');
  });
});
