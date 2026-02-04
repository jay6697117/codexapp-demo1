import Phaser from 'phaser';
import { Poolable } from '../utils/ObjectPool';

export type ParticleType = 'hit' | 'muzzle' | 'blood' | 'spark' | 'heal';

const PARTICLE_CONFIGS: Record<ParticleType, { color: number; size: number; duration: number }> = {
  hit: { color: 0xff6600, size: 3, duration: 300 },
  muzzle: { color: 0xffff00, size: 4, duration: 100 },
  blood: { color: 0xff0000, size: 3, duration: 400 },
  spark: { color: 0xffffff, size: 2, duration: 200 },
  heal: { color: 0x00ff00, size: 3, duration: 500 },
};

export class PoolableParticle implements Poolable {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Arc;
  private velocityX: number = 0;
  private velocityY: number = 0;
  private active: boolean = false;
  private lifeTime: number = 0;
  private maxLifeTime: number = 300;
  private fadeStart: number = 0.7; // 在生命周期70%时开始淡出

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.sprite = scene.add.arc(0, 0, 3, 0, 360, false, 0xffffff);
    this.sprite.setDepth(150);
    this.sprite.setVisible(false);
  }

  init(x: number, y: number, type: ParticleType, velocityX?: number, velocityY?: number): void {
    const config = PARTICLE_CONFIGS[type];

    this.sprite.setPosition(x, y);
    this.sprite.setFillStyle(config.color);
    this.sprite.setRadius(config.size);
    this.sprite.setAlpha(1);

    this.maxLifeTime = config.duration;
    this.lifeTime = 0;

    // 随机速度（如果未指定）
    this.velocityX = velocityX ?? (Math.random() - 0.5) * 200;
    this.velocityY = velocityY ?? (Math.random() - 0.5) * 200;

    this.sprite.setVisible(true);
  }

  update(delta: number): boolean {
    if (!this.active) return false;

    this.lifeTime += delta;
    if (this.lifeTime >= this.maxLifeTime) {
      return false;
    }

    // 更新位置
    this.sprite.x += this.velocityX * (delta / 1000);
    this.sprite.y += this.velocityY * (delta / 1000);

    // 减速
    this.velocityX *= 0.95;
    this.velocityY *= 0.95;

    // 淡出效果
    const progress = this.lifeTime / this.maxLifeTime;
    if (progress > this.fadeStart) {
      const fadeProgress = (progress - this.fadeStart) / (1 - this.fadeStart);
      this.sprite.setAlpha(1 - fadeProgress);
    }

    return true;
  }

  reset(): void {
    this.velocityX = 0;
    this.velocityY = 0;
    this.lifeTime = 0;
    this.sprite.setAlpha(1);
  }

  setActive(active: boolean): void {
    this.active = active;
    this.sprite.setVisible(active);
  }

  isActive(): boolean {
    return this.active;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
