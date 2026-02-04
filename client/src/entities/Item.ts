import Phaser from 'phaser';
import { PIXEL_COLORS, getPixelTextStyle } from '../ui/pixel-ui';

export type ItemType = 'weapon' | 'skill';

export interface ItemConfig {
  id: string;
  type: ItemType;
  subType: string; // weapon: 'smg'|'rifle'|'shotgun', skill: 'dash'|'shield' 等
  x: number;
  y: number;
}

export class Item extends Phaser.GameObjects.Container {
  public readonly itemId: string;
  public readonly itemType: ItemType;
  public readonly subType: string;
  private sprite: Phaser.GameObjects.Image;
  private label: Phaser.GameObjects.Text;
  private glowTween: Phaser.Tweens.Tween | null = null;
  private floatTween: Phaser.Tweens.Tween | null = null;
  private glowGraphics: Phaser.GameObjects.Graphics | null = null;
  private bodyPhysics!: Phaser.Physics.Arcade.Body;

  constructor(scene: Phaser.Scene, config: ItemConfig) {
    super(scene, config.x, config.y);

    this.itemId = config.id;
    this.itemType = config.type;
    this.subType = config.subType;

    const textureKey = `item_${this.subType}`;
    this.sprite = scene.add.image(0, 0, textureKey);
    this.sprite.setDisplaySize(16, 16);
    this.sprite.setTint(this.getItemColor());
    this.add(this.sprite);

    // 创建标签
    this.label = scene.add.text(0, 14, this.getDisplayName(), getPixelTextStyle(8, PIXEL_COLORS.textPrimary, {
      align: 'center',
    }));
    this.label.setOrigin(0.5);
    this.add(this.label);

    // 添加到场景
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body

    this.bodyPhysics = this.body as Phaser.Physics.Arcade.Body;
    const size = 16;
    this.bodyPhysics.setSize(size, size);
    this.bodyPhysics.setOffset(-size / 2, -size / 2);

    // 添加发光动画
    this.addGlowEffect();
  }

  private getItemColor(): number {
    if (this.itemType === 'weapon') {
      const colors: Record<string, number> = {
        smg: 0xff6600,
        rifle: 0x6666ff,
        shotgun: 0xff0066,
      };
      return colors[this.subType] || 0xffffff;
    }
    // 技能道具
    const skillColors: Record<string, number> = {
      dash: 0x00ff00,
      shield: 0x0088ff,
      backflip: 0xff00ff,
      healAura: 0x00ffff,
    };
    return skillColors[this.subType] || 0xffff00;
  }

  private getDisplayName(): string {
    const names: Record<string, string> = {
      smg: '冲锋枪',
      rifle: '步枪',
      shotgun: '霰弹枪',
      dash: '冲刺',
      shield: '护盾',
      backflip: '后空翻',
      healAura: '治疗光环',
    };
    return names[this.subType] || this.subType;
  }

  private addGlowEffect() {
    // 发光动画
    this.glowTween = this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 1, to: 0.7 },
      scale: { from: 1, to: 1.15 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // 悬浮动画
    this.floatTween = this.scene.tweens.add({
      targets: this,
      y: this.y - 6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 像素发光底座
    this.glowGraphics = this.scene.add.graphics();
    this.glowGraphics.setDepth(this.depth - 1);
    this.updateGlowGraphics();
  }

  private updateGlowGraphics() {
    if (!this.glowGraphics) return;

    this.glowGraphics.clear();
    const color = this.getItemColor();

    // 像素风格发光效果
    const glowSize = 24;
    const outerSize = 30;
    this.glowGraphics.fillStyle(color, 0.3);
    this.glowGraphics.fillRect(this.x - glowSize / 2, this.y - glowSize / 2, glowSize, glowSize);
    this.glowGraphics.fillStyle(color, 0.15);
    this.glowGraphics.fillRect(this.x - outerSize / 2, this.y - outerSize / 2, outerSize, outerSize);
  }

  update() {
    this.updateGlowGraphics();
  }

  destroy(fromScene?: boolean) {
    if (this.glowTween) {
      this.glowTween.destroy();
    }
    if (this.floatTween) {
      this.floatTween.destroy();
    }
    if (this.glowGraphics) {
      this.glowGraphics.destroy();
    }
    super.destroy(fromScene);
  }
}
