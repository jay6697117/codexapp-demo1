import Phaser from 'phaser';

export type PickupNotificationType = 'weapon' | 'skill';

export interface PickupNotificationStyle {
  text: string;
  color: string;
  stroke: string;
}

export function getPickupNotificationStyle(
  itemName: string,
  itemType: PickupNotificationType
): PickupNotificationStyle {
  const color = itemType === 'weapon' ? '#fbbf24' : '#a855f7';
  return {
    text: `+${itemName}`,
    color,
    stroke: '#0b0b0f',
  };
}

export class PickupNotification {
  private scene: Phaser.Scene;
  private readonly duration: number = 1500;
  private readonly startY: number = 120;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(itemName: string, itemType: PickupNotificationType) {
    const { width } = this.scene.cameras.main;
    const style = getPickupNotificationStyle(itemName, itemType);

    const text = this.scene.add.text(width / 2, this.startY, style.text, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: style.color,
      stroke: style.stroke,
      strokeThickness: 3,
    });
    text.setOrigin(0.5);
    text.setScrollFactor(0);
    text.setDepth(1200);
    text.setAlpha(0);

    this.scene.tweens.add({
      targets: text,
      alpha: 1,
      y: this.startY - 16,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.scene.time.delayedCall(this.duration - 400, () => {
          this.scene.tweens.add({
            targets: text,
            alpha: 0,
            y: this.startY - 32,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
              text.destroy();
            },
          });
        });
      },
    });
  }

  destroy() {
  }
}
