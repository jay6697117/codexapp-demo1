import type { Types } from 'phaser';

export const PIXEL_FONTS = {
  ui: '"Press Start 2P", monospace',
  numbers: '"VT323", monospace',
} as const;

// Solana/Pumpville Palette
const PALETTE = {
  neonGreen: 0x14f195,
  deepPurple: 0x9945ff,
  darkBg: 0x0f172a, // Slate 900
  glassBg: 0x1e293b, // Slate 800
  text: 0xf8fafc,
  textMuted: 0x94a3b8,
  danger: 0xef4444,
  warning: 0xf59e0b,
  info: 0x3b82f6,
};

export const PIXEL_COLORS = {
  panelBg: PALETTE.glassBg, // Lighter, glassy feel
  panelBorder: PALETTE.deepPurple, // Brand glow
  panelHighlight: PALETTE.neonGreen,
  panelInset: PALETTE.darkBg,

  hpFill: PALETTE.danger,
  hpBackground: 0x450a0a,
  hpBorder: 0x450a0a,

  ammoFill: PALETTE.neonGreen, // Pump green
  ammoBackground: 0x064e3b,
  ammoBorder: 0x064e3b,

  skillReady: PALETTE.neonGreen,
  skillActive: PALETTE.info,
  skillCooldown: PALETTE.warning,

  minimapBorder: PALETTE.deepPurple,
  minimapGrid: 0x334155,

  textPrimary: '#f8fafc',
  textMuted: '#94a3b8',
  textWarning: '#f59e0b',

  // New specific Pumpville colors
  neonGreen: PALETTE.neonGreen,
  deepPurple: PALETTE.deepPurple,
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
