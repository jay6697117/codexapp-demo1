import Phaser from 'phaser';
import { CHARACTERS } from '@shared/constants';
import { HealthBar } from '../ui/HealthBar';

// 角色颜色映射
const CHARACTER_COLORS: Record<string, number> = {
  assault: 0x00ff00,  // 绿色 - 突击兵
  tank: 0x0066ff,     // 蓝色 - 重装
  ranger: 0xffaa00,   // 橙色 - 游侠
  medic: 0xff66ff,    // 粉色 - 医疗兵
};

export class RemotePlayer extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Rectangle;
  private directionIndicator: Phaser.GameObjects.Triangle;
  private nameText: Phaser.GameObjects.Text;
  private healthBar: HealthBar;

  public sessionId: string;
  public playerName: string;
  public character: string;
  public hp: number = 100;
  public maxHp: number = 100;
  public isAlive: boolean = true;

  // 插值用
  private targetX: number = 0;
  private targetY: number = 0;
  private targetAngle: number = 0;

  constructor(scene: Phaser.Scene, sessionId: string, state: any) {
    super(scene, state.x, state.y);

    this.sessionId = sessionId;
    this.playerName = state.name || 'Unknown';
    this.character = state.character || 'assault';
    this.hp = state.hp;
    this.maxHp = state.maxHp;
    this.isAlive = state.isAlive;

    this.targetX = state.x;
    this.targetY = state.y;
    this.targetAngle = state.angle || 0;

    // 获取角色颜色
    const color = CHARACTER_COLORS[this.character] || 0x00ff00;

    // 创建精灵（简单矩形表示玩家）
    this.sprite = scene.add.rectangle(0, 0, 32, 32, color);
    this.sprite.setStrokeStyle(2, 0xffffff);
    this.add(this.sprite);

    // 方向指示器（三角形）
    this.directionIndicator = scene.add.triangle(20, 0, 0, -6, 0, 6, 10, 0, color);
    this.directionIndicator.setStrokeStyle(1, 0xffffff);
    this.add(this.directionIndicator);

    // 名字标签
    this.nameText = scene.add.text(0, -30, this.playerName, {
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.nameText.setOrigin(0.5);
    this.add(this.nameText);

    // 血条
    this.healthBar = new HealthBar(scene, 0, -42, 40, 4, this.maxHp);
    this.healthBar.setHp(this.hp, this.maxHp);
    this.add(this.healthBar);

    scene.add.existing(this);
    this.setDepth(10);

    // 设置初始可见性
    this.setVisible(this.isAlive);
  }

  updateFromState(state: any) {
    // 设置目标位置用于插值
    this.targetX = state.x;
    this.targetY = state.y;
    this.targetAngle = state.angle || 0;

    // 立即更新其他状态
    this.hp = state.hp;
    this.maxHp = state.maxHp;
    this.isAlive = state.isAlive;

    // 更新血条
    this.healthBar.setHp(this.hp, this.maxHp);

    // 更新可见性
    this.setVisible(this.isAlive);
  }

  update(_delta: number) {
    if (!this.isAlive) return;

    // 平滑插值到目标位置
    const lerpFactor = 0.2;
    this.x = Phaser.Math.Linear(this.x, this.targetX, lerpFactor);
    this.y = Phaser.Math.Linear(this.y, this.targetY, lerpFactor);

    // 插值旋转（方向指示器绕中心旋转）
    const currentAngle = this.directionIndicator.rotation;
    const angleDiff = Phaser.Math.Angle.Wrap(this.targetAngle - currentAngle);
    this.directionIndicator.rotation = currentAngle + angleDiff * 0.2;

    // 更新方向指示器位置（绕玩家旋转）
    const indicatorDistance = 20;
    this.directionIndicator.x = Math.cos(this.directionIndicator.rotation) * indicatorDistance;
    this.directionIndicator.y = Math.sin(this.directionIndicator.rotation) * indicatorDistance;
  }

  destroy() {
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    super.destroy();
  }
}
