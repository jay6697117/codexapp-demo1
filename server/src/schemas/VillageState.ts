import { Schema, type, MapSchema } from '@colyseus/schema';
import { PlayerState } from './PlayerState';
import { ItemState } from './ItemState';

export class VillageState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type({ map: ItemState }) items = new MapSchema<ItemState>();
}
