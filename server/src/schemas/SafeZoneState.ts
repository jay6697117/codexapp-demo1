import { Schema, type } from '@colyseus/schema';

export class SafeZoneState extends Schema {
  @type('number') x: number = 800;
  @type('number') y: number = 600;
  @type('number') currentRadius: number = 1000;
  @type('number') targetRadius: number = 1000;
  @type('number') phase: number = 0;
  @type('number') damage: number = 0;
  @type('boolean') isShrinking: boolean = false;
}
