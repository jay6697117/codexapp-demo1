import Phaser from 'phaser';
import { ObjectPool } from '../utils/ObjectPool';
import { PoolableBullet } from '../entities/PoolableBullet';
import { PoolableParticle, ParticleType } from '../effects/PoolableParticle';

export class PoolManager {
  private scene: Phaser.Scene;
  private bulletPool: ObjectPool<PoolableBullet>;
  private particlePool: ObjectPool<PoolableParticle>;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // 初始化子弹池
    this.bulletPool = new ObjectPool<PoolableBullet>(
      () => new PoolableBullet(scene),
      20,  // 初始大小
      100  // 最大大小
    );

    // 初始化粒子池
    this.particlePool = new ObjectPool<PoolableParticle>(
      () => new PoolableParticle(scene),
      50,  // 初始大小
      200  // 最大大小
    );
  }

  /**
   * 发射子弹
   */
  fireBullet(x: number, y: number, angle: number, speed: number, damage: number, ownerId: string): PoolableBullet | null {
    const bullet = this.bulletPool.acquire();
    if (bullet) {
      bullet.init(x, y, angle, speed, damage, ownerId);
    }
    return bullet;
  }

  /**
   * 生成粒子效果
   */
  spawnParticle(x: number, y: number, type: ParticleType, count: number = 1): void {
    for (let i = 0; i < count; i++) {
      const particle = this.particlePool.acquire();
      if (particle) {
        particle.init(x, y, type);
      }
    }
  }

  /**
   * 生成命中效果
   */
  spawnHitEffect(x: number, y: number): void {
    this.spawnParticle(x, y, 'hit', 5);
  }

  /**
   * 生成枪口火焰效果
   */
  spawnMuzzleFlash(x: number, y: number): void {
    this.spawnParticle(x, y, 'muzzle', 3);
  }

  /**
   * 生成血液效果
   */
  spawnBloodEffect(x: number, y: number): void {
    this.spawnParticle(x, y, 'blood', 8);
  }

  /**
   * 生成治疗效果
   */
  spawnHealEffect(x: number, y: number): void {
    this.spawnParticle(x, y, 'heal', 10);
  }

  /**
   * 每帧更新
   */
  update(delta: number): void {
    // 更新子弹
    this.bulletPool.forEachActive(bullet => {
      if (!bullet.update(delta)) {
        this.bulletPool.release(bullet);
      }
    });

    // 更新粒子
    this.particlePool.forEachActive(particle => {
      if (!particle.update(delta)) {
        this.particlePool.release(particle);
      }
    });
  }

  /**
   * 获取统计信息（调试用）
   */
  getStats(): { bullets: { active: number; total: number }; particles: { active: number; total: number } } {
    return {
      bullets: {
        active: this.bulletPool.getActiveCount(),
        total: this.bulletPool.getTotalCount(),
      },
      particles: {
        active: this.particlePool.getActiveCount(),
        total: this.particlePool.getTotalCount(),
      },
    };
  }

  /**
   * 销毁所有池
   */
  destroy(): void {
    this.bulletPool.destroy();
    this.particlePool.destroy();
  }
}
