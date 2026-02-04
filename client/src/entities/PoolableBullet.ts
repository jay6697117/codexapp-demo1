import Phaser from 'phaser';
import { Poolable } from '../utils/ObjectPool';

export class PoolableBullet implements Poolable {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Arc;
  private velocityX: number = 0;
  private velocityY: number = 0;
  private damage: number = 10;
  private ownerId: string = '';
  private active: boolean = false;
  private lifeTime: number = 0;
  private maxLifeTime: number = 2000; // 2秒后自动销毁

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.sprite = scene.add.arc(0, 0, 4, 0, 360, false, 0xffff00);
    this.sprite.setDepth(100);
    this.sprite.setVisible(false);
  }

  init(x: number, y: number, angle: number, speed: number, damage: number, ownerId: string): void {
    this.sprite.setPosition(x, y);
    this.velocityX = Math.cos(angle) * speed;
    this.velocityY = Math.sin(angle) * speed;
    this.damage = damage;
    this.ownerId = ownerId;
    this.lifeTime = 0;
    this.sprite.setVisible(true);
  }

  update(delta: number): boolean {
    if (!this.active) return false;

    this.lifeTime += delta;
    if (this.lifeTime >= this.maxLifeTime) {
      return false; // 需要销毁
    }

    this.sprite.x += this.velocityX * (delta / 1000);
    this.sprite.y += this.velocityY * (delta / 1000);

    return true; // 继续存活
  }

  reset(): void {
    this.velocityX = 0;
    this.velocityY = 0;
    this.damage = 10;
    this.ownerId = '';
    this.lifeTime = 0;
  }

  setActive(active: boolean): void {
    this.active = active;
    this.sprite.setVisible(active);
  }

  isActive(): boolean {
    return this.active;
  }

  getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  getDamage(): number {
    return this.damage;
  }

  getOwnerId(): string {
    return this.ownerId;
  }

  getSprite(): Phaser.GameObjects.Arc {
    return this.sprite;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
