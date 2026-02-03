import Phaser from 'phaser';
import { WEAPONS, GAME_CONFIG } from '@shared/constants';
import { WeaponType } from '@shared/types';

export class Bullet extends Phaser.GameObjects.Image {
  public readonly ownerId: string;
  public readonly weaponType: WeaponType;
  public readonly damage: number;
  public readonly range: number;

  private startX: number;
  private startY: number;
  private speed: number = 800;
  private bodyPhysics!: Phaser.Physics.Arcade.Body;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    angle: number,
    ownerId: string,
    weaponType: WeaponType
  ) {
    super(scene, x, y, 'bullet');

    this.ownerId = ownerId;
    this.weaponType = weaponType;
    this.startX = x;
    this.startY = y;

    const weaponConfig = WEAPONS[weaponType];
    this.damage = weaponConfig.damage;
    this.range = weaponConfig.range;

    // 添加到场景
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.bodyPhysics = this.body as Phaser.Physics.Arcade.Body;
    this.bodyPhysics.setSize(8, 8);

    // 设置旋转和速度
    this.setRotation(angle);
    const velocityX = Math.cos(angle) * this.speed;
    const velocityY = Math.sin(angle) * this.speed;
    this.bodyPhysics.setVelocity(velocityX, velocityY);
  }

  update() {
    // 检查是否超出射程
    const distance = Phaser.Math.Distance.Between(
      this.startX,
      this.startY,
      this.x,
      this.y
    );

    if (distance > this.range) {
      this.destroy();
      return;
    }

    // 检查是否出界
    if (
      this.x < 0 ||
      this.y < 0 ||
      this.x > GAME_CONFIG.MAP_WIDTH ||
      this.y > GAME_CONFIG.MAP_HEIGHT
    ) {
      this.destroy();
    }
  }
}
