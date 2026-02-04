import { describe, expect, it } from 'vitest';
import { buildGameTextState } from './game-text-state';

describe('game text state', () => {
  it('builds a JSON payload with core fields', () => {
    const payload = buildGameTextState({
      player: { x: 10, y: 20, hp: 80, maxHp: 100 },
      weapon: { name: 'SMG', ammo: 12, maxAmmo: 30 },
      skill: { name: 'dash', cooldownPercent: 0.5, remainingMs: 2000, isActive: false },
      zone: { x: 200, y: 300, currentRadius: 400, targetRadius: 240, timeToNextPhase: 30000, isShrinking: true },
      alive: 5,
      total: 10,
    });

    const data = JSON.parse(payload);
    expect(data.player.hp).toBe(80);
    expect(data.weapon.name).toBe('SMG');
    expect(data.zone.isShrinking).toBe(true);
    expect(data.coords).toBe('origin top-left');
  });
});
