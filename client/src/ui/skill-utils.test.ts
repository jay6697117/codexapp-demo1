import { describe, expect, it } from 'vitest';
import { formatSkillLabel, formatSkillStatus, getSkillState } from './skill-utils';

describe('skill utils', () => {
  it('determines skill state', () => {
    expect(getSkillState(1, false)).toBe('ready');
    expect(getSkillState(0.5, true)).toBe('active');
    expect(getSkillState(0.4, false)).toBe('cooldown');
  });

  it('formats skill labels', () => {
    expect(formatSkillLabel('dash')).toBe('Q DASH');
  });

  it('formats skill status text', () => {
    expect(formatSkillStatus('ready', 0)).toBe('READY');
    expect(formatSkillStatus('active', 0)).toBe('ACTIVE');
    expect(formatSkillStatus('cooldown', 3200)).toBe('COOLDOWN 4s');
  });
});
