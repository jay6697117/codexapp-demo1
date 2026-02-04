import { clampPercent } from './pixel-ui';

export function getHealthPercent(current: number, max: number): number {
  if (max <= 0) return 0;
  return clampPercent(current / max);
}

export function isLowHealth(percent: number): boolean {
  return percent <= 0.25;
}
