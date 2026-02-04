export type HudLayoutBox = { x: number; y: number; width: number; height: number };

export interface HudLayout {
  minimap: HudLayoutBox;
  topInfoBar: HudLayoutBox;
  ammoBox: HudLayoutBox;
  skillBar: HudLayoutBox;
  hpBar: HudLayoutBox;
}

export interface HudLayoutOptions {
  screenWidth: number;
  screenHeight: number;
  padding?: number;
  gap?: number;
  minimapSize?: number;
}

const DEFAULTS = {
  padding: 16,
  gap: 12,
  minimapSize: 150,
  minimapMinSize: 110,
  ammoBox: { width: 180, height: 70 },
  skillBar: { width: 160, height: 70 },
  hpBar: { width: 160, height: 16 },
  topInfoBar: { maxWidth: 300, minWidth: 180, height: 36 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateHudLayout(options: HudLayoutOptions): HudLayout {
  const padding = options.padding ?? DEFAULTS.padding;
  const gap = options.gap ?? DEFAULTS.gap;

  const hpBar: HudLayoutBox = {
    x: padding,
    y: padding,
    width: DEFAULTS.hpBar.width,
    height: DEFAULTS.hpBar.height,
  };

  const minimapSize = options.minimapSize ?? DEFAULTS.minimapSize;
  const minimap: HudLayoutBox = {
    x: options.screenWidth - minimapSize - padding,
    y: padding,
    width: minimapSize,
    height: minimapSize,
  };

  const topBarAvailable = Math.max(
    0,
    minimap.x - gap - (hpBar.x + hpBar.width + gap)
  );
  const topInfoBarWidth =
    topBarAvailable < DEFAULTS.topInfoBar.minWidth
      ? 0
      : Math.min(DEFAULTS.topInfoBar.maxWidth, topBarAvailable);

  const topInfoBar: HudLayoutBox = {
    width: topInfoBarWidth,
    height: DEFAULTS.topInfoBar.height,
    x: minimap.x - gap - topInfoBarWidth,
    y: padding,
  };

  const ammoBox: HudLayoutBox = {
    width: DEFAULTS.ammoBox.width,
    height: DEFAULTS.ammoBox.height,
    x: options.screenWidth - DEFAULTS.ammoBox.width - padding,
    y: options.screenHeight - DEFAULTS.ammoBox.height - padding,
  };

  const skillBar: HudLayoutBox = {
    width: DEFAULTS.skillBar.width,
    height: DEFAULTS.skillBar.height,
    x: padding,
    y: options.screenHeight - DEFAULTS.skillBar.height - padding,
  };

  return {
    minimap,
    topInfoBar,
    ammoBox,
    skillBar,
    hpBar,
  };
}
