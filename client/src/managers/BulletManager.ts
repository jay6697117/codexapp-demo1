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

  spawnBullet(x: number, y: number, angle: number, weaponType: WeaponType) {
    // For network spawned bullets, we might use a generic owner or skip owner check
    const bullet = new Bullet(this.scene, x, y, angle, 'network', weaponType);
    this.bullets.add(bullet);
    return bullet;
  }

  getBullets(): Phaser.GameObjects.Group {
    return this.bullets;
  }

  getActiveCount(): number {
    return this.bullets.countActive(true);
  }

  update() {
    // Group 已配置 runChildUpdate，子弹会自动更新
  }

  clear() {
    this.bullets.clear(true, true);
  }
}
