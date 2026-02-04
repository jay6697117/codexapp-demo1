import Phaser from 'phaser';
import { PIXEL_COLORS, getPixelTextStyle } from './pixel-ui';
import { formatAliveText, formatZoneTimer } from './top-info-utils';

export class TopInfoBar extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private border: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  // width/height inherited from Container

  constructor(scene: Phaser.Scene, x: number, y: number, width: number = 300, height: number = 36) {
    super(scene, x, y);

    this.width = width;
    this.height = height;

    this.background = scene.add.graphics();
    this.border = scene.add.graphics();
    this.text = scene.add.text(12, height / 2, '', getPixelTextStyle(10, PIXEL_COLORS.textPrimary, {
      align: 'left',
    }));
    this.text.setOrigin(0, 0.5);

    this.add(this.background);
    this.add(this.border);
    this.add(this.text);

    this.drawPanel();
    scene.add.existing(this);
  }

  updateInfo(alive: number, total: number, timeToNextPhase: number, isShrinking: boolean) {
    const aliveText = formatAliveText(alive, total);
    const timerText = formatZoneTimer(timeToNextPhase);
    const shrinkText = isShrinking ? ' SHRINKING' : '';
    this.text.setText(`${aliveText}  ${timerText}${shrinkText}`);
  }

  private drawPanel() {
    this.background.clear();
    this.background.fillStyle(PIXEL_COLORS.panelBg, 0.85);
    this.background.fillRect(0, 0, this.width, this.height);

    this.border.clear();
    this.border.lineStyle(2, PIXEL_COLORS.panelBorder, 1);
    this.border.strokeRect(0, 0, this.width, this.height);
    this.border.lineStyle(2, PIXEL_COLORS.panelHighlight, 1);
    this.border.strokeRect(2, 2, this.width - 4, this.height - 4);
  }
}
