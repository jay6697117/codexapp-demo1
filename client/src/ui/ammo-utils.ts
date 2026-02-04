import { clampPercent } from './pixel-ui';

export function formatAmmoText(current: number, max: number): string {
  return `${current} / ${max}`;
}

export function getAmmoPercent(current: number, max: number): number {
  if (max <= 0) return 0;
  return clampPercent(current / max);
}
