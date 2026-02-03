import Phaser from 'phaser';
import { Bullet } from '../entities/Bullet';
import { WeaponType } from '@shared/types';

export class BulletManager {
  private scene: Phaser.Scene;
  private bullets: Phaser.GameObjects.Group;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.bullets = scene.add.group({
      classType: Bullet,
      runChildUpdate: true,
    });
  }

  fire(
    x: number,
    y: number,
    angle: number,
    ownerId: string,
    weaponType: WeaponType
  ): Bullet {
    const bullet = new Bullet(this.scene, x, y, angle, ownerId, weaponType);
    this.bullets.add(bullet);
    return bullet;
  }

  getBullets(): Phaser.GameObjects.Group {
    return this.bullets;
  }

  update() {
    // Group 已配置 runChildUpdate，子弹会自动更新
  }

  clear() {
    this.bullets.clear(true, true);
  }
}
