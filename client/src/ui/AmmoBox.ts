import Phaser from 'phaser';
import { PIXEL_COLORS, getNumericTextStyle, getPixelTextStyle } from './pixel-ui';
import { formatAmmoText, getAmmoPercent } from './ammo-utils';

export class AmmoBox extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private border: Phaser.GameObjects.Graphics;
  private bar: Phaser.GameObjects.Graphics;
  private weaponText: Phaser.GameObjects.Text;
  private ammoText: Phaser.GameObjects.Text;
  private reloadText: Phaser.GameObjects.Text;
  private width: number;
  private height: number;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number = 180, height: number = 70) {
    super(scene, x, y);

    this.width = width;
    this.height = height;

    this.background = scene.add.graphics();
    this.border = scene.add.graphics();
    this.bar = scene.add.graphics();

    this.weaponText = scene.add.text(12, 10, '', getPixelTextStyle(10, PIXEL_COLORS.textPrimary));
    this.weaponText.setOrigin(0, 0);

    this.ammoText = scene.add.text(12, 28, '', getNumericTextStyle(20, PIXEL_COLORS.textPrimary));
    this.ammoText.setOrigin(0, 0);

    this.reloadText = scene.add.text(12, 52, '', getPixelTextStyle(8, PIXEL_COLORS.textWarning));
    this.reloadText.setOrigin(0, 0);

    this.add(this.background);
    this.add(this.border);
    this.add(this.bar);
    this.add(this.weaponText);
    this.add(this.ammoText);
    this.add(this.reloadText);

    this.drawPanel();
    scene.add.existing(this);
  }

  updateAmmo(weaponName: string, ammo: number, maxAmmo: number, isReloading: boolean, reloadProgress: number) {
    const percent = getAmmoPercent(ammo, maxAmmo);
    const barColor = percent <= 0.25 ? PIXEL_COLORS.hpFill : PIXEL_COLORS.ammoFill;

    this.weaponText.setText(weaponName.toUpperCase());
    this.ammoText.setText(formatAmmoText(ammo, maxAmmo));

    if (isReloading) {
      const progress = Math.floor(reloadProgress * 100);
      this.reloadText.setText(`RELOADING ${progress}%`);
      this.reloadText.setVisible(true);
    } else if (ammo === 0) {
      this.reloadText.setText('PRESS R');
      this.reloadText.setVisible(true);
    } else {
      this.reloadText.setVisible(false);
    }

    this.drawBar(percent, barColor);
  }

  private drawPanel() {
    this.background.clear();
    this.background.fillStyle(PIXEL_COLORS.panelBg, 0.9);
    this.background.fillRect(0, 0, this.width, this.height);

    this.border.clear();
    this.border.lineStyle(2, PIXEL_COLORS.panelBorder, 1);
    this.border.strokeRect(0, 0, this.width, this.height);

    this.border.lineStyle(2, PIXEL_COLORS.panelHighlight, 1);
    this.border.strokeRect(2, 2, this.width - 4, this.height - 4);
  }

  private drawBar(percent: number, color: number) {
    const barX = 12;
    const barY = 46;
    const barWidth = this.width - 24;
    const barHeight = 8;

    this.bar.clear();
    this.bar.fillStyle(PIXEL_COLORS.ammoBackground, 1);
    this.bar.fillRect(barX, barY, barWidth, barHeight);

    this.bar.fillStyle(color, 1);
    this.bar.fillRect(barX, barY, barWidth * percent, barHeight);

    this.bar.lineStyle(2, PIXEL_COLORS.ammoBorder, 1);
    this.bar.strokeRect(barX, barY, barWidth, barHeight);
  }
}
