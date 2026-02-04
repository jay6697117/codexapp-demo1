import Phaser from 'phaser';

interface Notification {
  text: Phaser.GameObjects.Text;
  createdAt: number;
}

export class PickupNotification {
  private scene: Phaser.Scene;
  private notifications: Notification[] = [];
  private readonly duration: number = 1500;
  private readonly startY: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.startY = 120;
  }

  show(itemName: string, itemType: 'weapon' | 'skill') {
    const { width } = this.scene.cameras.main;
    const color = itemType === 'weapon' ? '#FFC107' : '#7C4DFF';
    const prefix = itemType === 'weapon' ? '+' : '+';

    const text = this.scene.add.text(width / 2, this.startY, `${prefix}${itemName}`, {
      fontSize: '16px',
      fontFamily: '"Press Start 2P", monospace',
      color: color,
      stroke: '#000000',
      strokeThickness: 3,
    });
    text.setOrigin(0.5);
    text.setScrollFactor(0);
    text.setDepth(1200);
    text.setAlpha(0);

    // 淡入 + 上浮动画
    this.scene.tweens.add({
      targets: text,
      alpha: 1,
      y: this.startY - 20,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        // 停留后淡出
        this.scene.time.delayedCall(this.duration - 400, () => {
          this.scene.tweens.add({
            targets: text,
            alpha: 0,
            y: this.startY - 40,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
              text.destroy();
              this.notifications = this.notifications.filter(n => n.text !== text);
            },
          });
        });
      },
    });

    this.notifications.push({ text, createdAt: Date.now() });
  }

  destroy() {
    this.notifications.forEach(n => n.text.destroy());
    this.notifications = [];
  }
}
