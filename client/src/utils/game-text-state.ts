export interface GameTextStateInput {
  player: { x: number; y: number; hp: number; maxHp: number };
  weapon: { name: string; ammo: number; maxAmmo: number };
  skill: { name: string; cooldownPercent: number; remainingMs: number; isActive: boolean };
  zone: { x: number; y: number; currentRadius: number; targetRadius: number; timeToNextPhase: number; isShrinking: boolean };
  bullet: { active: number; hits: number };
  alive: number;
  total: number;
}

export function buildGameTextState(input: GameTextStateInput): string {
  return JSON.stringify({
    mode: 'game',
    coords: 'origin top-left',
    player: input.player,
    weapon: input.weapon,
    skill: input.skill,
    zone: input.zone,
    bullet: input.bullet,
    alive: input.alive,
    total: input.total,
  });
}
