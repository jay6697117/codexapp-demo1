export type SkillState = 'ready' | 'active' | 'cooldown';

export function getSkillState(cooldownPercent: number, isActive: boolean): SkillState {
  if (isActive) return 'active';
  if (cooldownPercent >= 1) return 'ready';
  return 'cooldown';
}

export function formatSkillLabel(skillName: string): string {
  return `Q ${skillName.toUpperCase()}`;
}

export function formatSkillStatus(state: SkillState, remainingMs: number): string {
  if (state === 'ready') return 'READY';
  if (state === 'active') return 'ACTIVE';
  const remaining = Math.ceil(remainingMs / 1000);
  return `COOLDOWN ${remaining}s`;
}
