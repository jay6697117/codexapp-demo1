import { WEAPONS, CHARACTERS } from './constants';

export type WeaponType = keyof typeof WEAPONS;
export type CharacterType = keyof typeof CHARACTERS;
export type RoomPhase = 'waiting' | 'starting' | 'playing' | 'ended';

export interface PlayerInput {
  dx: number;
  dy: number;
  angle: number;
  shooting: boolean;
  skill: boolean;
}

export interface IPlayerState {
  id: string;
  name: string;
  character: CharacterType;
  x: number;
  y: number;
  angle: number;
  hp: number;
  maxHp: number;
  weapon: WeaponType;
  ammo: number;
  isAlive: boolean;
  kills: number;
  damage: number;
  skillCooldown: number;
  itemSkill: string | null;
}

export interface IItemState {
  id: string;
  type: 'weapon' | 'skill';
  subType: string;
  x: number;
  y: number;
  isActive: boolean;
}

export interface ISafeZone {
  x: number;
  y: number;
  radius: number;
  nextX: number;
  nextY: number;
  nextRadius: number;
  shrinking: boolean;
}

export interface IRoomState {
  phase: RoomPhase;
  countdown: number;
  elapsedTime: number;
  safeZone: ISafeZone;
  players: Record<string, IPlayerState>;
  items: Record<string, IItemState>;
  alivePlayers: number;
}

export interface GameResult {
  rank: number;
  kills: number;
  damage: number;
  survivalTime: number;
}
