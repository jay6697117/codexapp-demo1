import { Schema, type, MapSchema } from '@colyseus/schema';
import { PlayerState } from './PlayerState';
import { ItemState } from './ItemState';
import { BulletState } from './BulletState';
import { SafeZoneState } from './SafeZoneState';

export type RoomPhase = 'waiting' | 'starting' | 'playing' | 'ended';

export class GameRoomState extends Schema {
  @type('string') phase: RoomPhase = 'waiting';
  @type('number') countdown: number = 0;
  @type('number') elapsedTime: number = 0;
  @type('number') alivePlayers: number = 0;

  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type({ map: ItemState }) items = new MapSchema<ItemState>();
  @type({ map: BulletState }) bullets = new MapSchema<BulletState>();
  @type(SafeZoneState) safeZone = new SafeZoneState();
}
