import Phaser from 'phaser';
import { PIXEL_COLORS, getNumericTextStyle, getPixelTextStyle } from './pixel-ui';
import { formatSkillLabel, formatSkillStatus, getSkillState } from './skill-utils';

export class SkillBar extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private border: Phaser.GameObjects.Graphics;
  private icon: Phaser.GameObjects.Graphics;
  private bar: Phaser.GameObjects.Graphics;
  private labelText: Phaser.GameObjects.Text;
  private statusText: Phaser.GameObjects.Text;
  private width: number;
  private height: number;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number = 160, height: number = 70) {
    super(scene, x, y);

    this.width = width;
    this.height = height;

    this.background = scene.add.graphics();
    this.border = scene.add.graphics();
    this.icon = scene.add.graphics();
    this.bar = scene.add.graphics();

    this.labelText = scene.add.text(48, 10, '', getPixelTextStyle(10, PIXEL_COLORS.textPrimary));
    this.labelText.setOrigin(0, 0);

    this.statusText = scene.add.text(48, 32, '', getNumericTextStyle(14, PIXEL_COLORS.textMuted));
    this.statusText.setOrigin(0, 0);

    this.add(this.background);
    this.add(this.border);
    this.add(this.icon);
    this.add(this.bar);
    this.add(this.labelText);
    this.add(this.statusText);

    this.drawPanel();
    this.drawIcon();
    scene.add.existing(this);
  }

  updateSkill(skillName: string, cooldownPercent: number, isActive: boolean, remainingMs: number) {
    const state = getSkillState(cooldownPercent, isActive);
    const label = formatSkillLabel(skillName);
    const status = formatSkillStatus(state, remainingMs);

    this.labelText.setText(label);
    this.statusText.setText(status);

    const barColor = state === 'ready'
      ? PIXEL_COLORS.skillReady
      : state === 'active'
        ? PIXEL_COLORS.skillActive
        : PIXEL_COLORS.skillCooldown;

    this.drawBar(cooldownPercent, barColor);
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

  private drawIcon() {
    const x = 10;
    const y = 10;
    const size = 28;

    this.icon.clear();
    this.icon.fillStyle(PIXEL_COLORS.panelInset, 1);
    this.icon.fillRect(x, y, size, size);
    this.icon.lineStyle(2, PIXEL_COLORS.panelBorder, 1);
    this.icon.strokeRect(x, y, size, size);

    this.icon.fillStyle(PIXEL_COLORS.skillActive, 1);
    this.icon.fillRect(x + 12, y + 4, 4, 12);
    this.icon.fillRect(x + 8, y + 12, 12, 4);
  }

  private drawBar(percent: number, color: number) {
    const barX = 48;
    const barY = 52;
    const barWidth = this.width - 60;
    const barHeight = 8;

    this.bar.clear();
    this.bar.fillStyle(PIXEL_COLORS.panelInset, 1);
    this.bar.fillRect(barX, barY, barWidth, barHeight);

    this.bar.fillStyle(color, 1);
    this.bar.fillRect(barX, barY, barWidth * Math.min(1, Math.max(0, percent)), barHeight);

    this.bar.lineStyle(2, PIXEL_COLORS.panelBorder, 1);
    this.bar.strokeRect(barX, barY, barWidth, barHeight);
  }
}
