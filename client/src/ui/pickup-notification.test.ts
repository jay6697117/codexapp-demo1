import { describe, expect, it } from 'vitest';
import { getPickupNotificationStyle } from './PickupNotification';

describe('getPickupNotificationStyle', () => {
  it('formats weapon pickup text and color', () => {
    const style = getPickupNotificationStyle('SMG', 'weapon');
    expect(style.text).toBe('+SMG');
    expect(style.color).toBe('#fbbf24');
  });

  it('formats skill pickup text and color', () => {
    const style = getPickupNotificationStyle('Dash', 'skill');
    expect(style.text).toBe('+Dash');
    expect(style.color).toBe('#a855f7');
  });
});
