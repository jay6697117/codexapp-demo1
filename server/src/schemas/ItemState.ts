import { Schema, type } from '@colyseus/schema';

export class ItemState extends Schema {
  @type('string') id: string = '';
  @type('string') itemType: string = 'weapon'; // 'weapon' | 'skill'
  @type('string') subType: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('boolean') isActive: boolean = true;
}
