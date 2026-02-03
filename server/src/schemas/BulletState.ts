import { Schema, type } from '@colyseus/schema';

export class BulletState extends Schema {
  @type('string') id: string = '';
  @type('string') ownerId: string = '';
  @type('string') weapon: string = 'pistol';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') angle: number = 0;
  @type('number') damage: number = 10;
}
