import type { Types } from 'phaser';

export const PIXEL_FONTS = {
  ui: '"Press Start 2P", monospace',
  numbers: '"VT323", monospace',
} as const;

export const PIXEL_COLORS = {
  panelBg: 0x0b0b0f,
  panelBorder: 0x2a2a38,
  panelHighlight: 0x4b4b5e,
  panelInset: 0x111827,
  hpFill: 0xff3b3b,
  hpBackground: 0x3a0f0f,
  hpBorder: 0x220606,
  ammoFill: 0x38bdf8,
  ammoBackground: 0x0b1c2b,
  ammoBorder: 0x0f2740,
  skillReady: 0x22c55e,
  skillActive: 0x38bdf8,
  skillCooldown: 0xf97316,
  minimapBorder: 0xeab308,
  minimapGrid: 0x1f2937,
  textPrimary: '#f8fafc',
  textMuted: '#94a3b8',
  textWarning: '#f59e0b',
} as const;

export function clampPercent(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function getPixelTextStyle(
  size: number,
  color: string,
  extra: Partial<Types.GameObjects.Text.TextStyle> = {}
): Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: PIXEL_FONTS.ui,
    fontSize: `${size}px`,
    color,
    ...extra,
  };
}

export function getNumericTextStyle(
  size: number,
  color: string,
  extra: Partial<Types.GameObjects.Text.TextStyle> = {}
): Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: PIXEL_FONTS.numbers,
    fontSize: `${size}px`,
    color,
    ...extra,
  };
}
