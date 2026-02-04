import Phaser from 'phaser';
import { PIXEL_COLORS, getNumericTextStyle } from './pixel-ui';
import { getHealthPercent, isLowHealth } from './health-bar-utils';

interface HealthBarOptions {
  showIcon?: boolean;
  showText?: boolean;
}

export class HealthBar extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private border: Phaser.GameObjects.Graphics;
  private bar: Phaser.GameObjects.Graphics;
  private icon: Phaser.GameObjects.Graphics | null = null;
  private hpText: Phaser.GameObjects.Text | null = null;
  private blinkTween: Phaser.Tweens.Tween | null = null;
  // width/height inherited from Container
  private maxHp: number;
  private currentHp: number;
  private options: HealthBarOptions;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number = 40,
    height: number = 6,
    maxHp: number = 100,
    options: HealthBarOptions = {}
  ) {
    super(scene, x, y);

    this.width = width;
    this.height = height;
    this.maxHp = maxHp;
    this.currentHp = maxHp;
    this.options = options;

    this.background = scene.add.graphics();
    this.add(this.background);

    this.bar = scene.add.graphics();
    this.add(this.bar);

    this.border = scene.add.graphics();
    this.add(this.border);

    if (this.options.showIcon) {
      this.icon = scene.add.graphics();
      this.add(this.icon);
    }

    if (this.options.showText) {
      this.hpText = scene.add.text(0, 0, '', getNumericTextStyle(14, PIXEL_COLORS.textPrimary));
      this.hpText.setOrigin(1, 0.5);
      this.add(this.hpText);
    }

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
    const percent = getHealthPercent(this.currentHp, this.maxHp);
    const iconSize = this.options.showIcon ? Math.max(10, this.height) : 0;
    const iconGap = this.options.showIcon ? 6 : 0;
    const barLeft = -this.width / 2 + iconSize + iconGap;
    const barWidth = this.width - iconSize - iconGap;

    this.background.clear();
    this.background.fillStyle(PIXEL_COLORS.hpBackground, 1);
    this.background.fillRect(-this.width / 2, 0, this.width, this.height);

    this.bar.clear();
    this.bar.fillStyle(PIXEL_COLORS.hpFill, 1);
    this.bar.fillRect(barLeft, 0, barWidth * percent, this.height);

    this.border.clear();
    this.border.lineStyle(2, PIXEL_COLORS.hpBorder, 1);
    this.border.strokeRect(-this.width / 2, 0, this.width, this.height);

    if (this.icon) {
      this.icon.clear();
      this.drawHeartIcon(this.icon, -this.width / 2 + 2, 1, Math.min(iconSize - 2, this.height - 2));
    }

    if (this.hpText) {
      this.hpText.setText(`${Math.ceil(this.currentHp)}`);
      this.hpText.setPosition(this.width / 2 - 4, this.height / 2);
    }

    if (isLowHealth(percent)) {
      this.startBlink();
    } else {
      this.stopBlink();
    }
  }

  private drawHeartIcon(graphics: Phaser.GameObjects.Graphics, x: number, y: number, size: number) {
    const pixel = Math.max(1, Math.floor(size / 6));
    const color = PIXEL_COLORS.hpFill;

    graphics.fillStyle(color, 1);
    graphics.fillRect(x + pixel, y, pixel * 2, pixel * 2);
    graphics.fillRect(x + pixel * 4, y, pixel * 2, pixel * 2);
    graphics.fillRect(x, y + pixel, pixel * 6, pixel * 3);
    graphics.fillRect(x + pixel, y + pixel * 4, pixel * 4, pixel * 2);
  }

  private startBlink() {
    if (this.blinkTween) return;
    this.blinkTween = this.scene.tweens.add({
      targets: this.bar,
      alpha: { from: 1, to: 0.4 },
      duration: 350,
      yoyo: true,
      repeat: -1,
    });
  }

  private stopBlink() {
    if (!this.blinkTween) return;
    this.blinkTween.stop();
    this.blinkTween = null;
    this.bar.setAlpha(1);
  }
}
