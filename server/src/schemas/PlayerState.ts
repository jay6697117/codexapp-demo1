import { Schema, type } from '@colyseus/schema';

export class PlayerState extends Schema {
  @type('string') id: string = '';
  @type('string') name: string = '';
  @type('string') character: string = 'assault';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') angle: number = 0;
  @type('number') hp: number = 100;
  @type('number') maxHp: number = 100;
  @type('string') weapon: string = 'pistol';
  @type('number') ammo: number = 12;
  @type('boolean') isAlive: boolean = true;
  @type('number') kills: number = 0;
  @type('number') damage: number = 0;
  @type('number') skillCooldown: number = 0;
  @type('string') itemSkill: string = '';
  @type('boolean') isInvincible: boolean = false;
  @type('number') coins: number = 0;
}
