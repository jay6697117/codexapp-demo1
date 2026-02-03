import { PlayerInput, CharacterType } from './types';

// 客户端 -> 服务器 消息
export interface JoinOptions {
  name: string;
  character: CharacterType;
}

export interface InputMessage {
  type: 'input';
  input: PlayerInput;
  seq: number;
}

export interface PingMessage {
  type: 'ping';
  timestamp: number;
}

export type ClientMessage = InputMessage | PingMessage;

// 服务器 -> 客户端 消息
export interface HitMessage {
  type: 'hit';
  attackerId: string;
  targetId: string;
  damage: number;
  targetHp: number;
}

export interface KillMessage {
  type: 'kill';
  killerId: string;
  victimId: string;
  killerKills: number;
}

export interface ZoneMessage {
  type: 'zone';
  phase: number;
  x: number;
  y: number;
  radius: number;
  nextX: number;
  nextY: number;
  nextRadius: number;
}

export interface PongMessage {
  type: 'pong';
  timestamp: number;
  serverTime: number;
}

export interface GameStartMessage {
  type: 'gameStart';
  spawnPoints: Array<{ id: string; x: number; y: number }>;
}

export interface GameEndMessage {
  type: 'gameEnd';
  rankings: Array<{
    id: string;
    name: string;
    rank: number;
    kills: number;
    damage: number;
  }>;
}

export type ServerMessage =
  | HitMessage
  | KillMessage
  | ZoneMessage
  | PongMessage
  | GameStartMessage
  | GameEndMessage;
