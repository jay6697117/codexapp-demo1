import Phaser from 'phaser';

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
  private bodyPhysics!: Phaser.Physics.Arcade.Body;

  constructor(scene: Phaser.Scene, config: ItemConfig) {
    super(scene, config.x, config.y);

    this.itemId = config.id;
    this.itemType = config.type;
    this.subType = config.subType;

    // 创建道具精灵
    this.sprite = scene.add.image(0, 0, 'item');
    this.sprite.setTint(this.getItemColor());
    this.add(this.sprite);

    // 创建标签
    this.label = scene.add.text(0, 18, this.getDisplayName(), {
      fontSize: '10px',
      color: '#ffffff',
      align: 'center',
    });
    this.label.setOrigin(0.5);
    this.add(this.label);

    // 添加到场景
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body

    this.bodyPhysics = this.body as Phaser.Physics.Arcade.Body;
    this.bodyPhysics.setSize(24, 24);
    this.bodyPhysics.setOffset(-12, -12);

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
    this.glowTween = this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 1, to: 0.6 },
      scale: { from: 1, to: 1.1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  destroy(fromScene?: boolean) {
    if (this.glowTween) {
      this.glowTween.destroy();
    }
    super.destroy(fromScene);
  }
}
