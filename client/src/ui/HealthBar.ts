import Phaser from 'phaser';

export class HealthBar extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private bar: Phaser.GameObjects.Graphics;
  private width: number;
  private height: number;
  private maxHp: number;
  private currentHp: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number = 40,
    height: number = 6,
    maxHp: number = 100
  ) {
    super(scene, x, y);

    this.width = width;
    this.height = height;
    this.maxHp = maxHp;
    this.currentHp = maxHp;

    // 背景
    this.background = scene.add.graphics();
    this.background.fillStyle(0x000000, 0.7);
    this.background.fillRect(-width / 2, 0, width, height);
    this.add(this.background);

    // 血条
    this.bar = scene.add.graphics();
    this.add(this.bar);

    this.updateBar();
    scene.add.existing(this);
  }

  setHp(current: number, max?: number) {
    this.currentHp = Math.max(0, current);
    if (max !== undefined) {
      this.maxHp = max;
    }
    this.updateBar();
  }

  private updateBar() {
    this.bar.clear();

    const percent = this.currentHp / this.maxHp;
    const barWidth = this.width * percent;

    // 根据血量百分比变色
    let color: number;
    if (percent > 0.6) {
      color = 0x00ff00; // 绿色
    } else if (percent > 0.3) {
      color = 0xffff00; // 黄色
    } else {
      color = 0xff0000; // 红色
    }

    this.bar.fillStyle(color, 1);
    this.bar.fillRect(-this.width / 2, 0, barWidth, this.height);
  }
}
