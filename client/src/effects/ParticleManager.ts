import Phaser from 'phaser';
import { PIXEL_COLORS } from '../ui/pixel-ui';

export class ParticleManager {
  private scene: Phaser.Scene;
  private pixelTexture: string;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.pixelTexture = 'pixel_particle';
    this.createPixelTexture();
  }

  private createPixelTexture() {
    if (this.scene.textures.exists(this.pixelTexture)) return;
    const graphics = this.scene.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 4, 4);
    graphics.generateTexture(this.pixelTexture, 4, 4);
    graphics.destroy();
  }

  playHitEffect(x: number, y: number, color: number = PIXEL_COLORS.skillActive) {
    const emitter = this.scene.add.particles(x, y, this.pixelTexture, {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      blendMode: 'ADD',
      lifespan: 300,
      gravityY: 0,
      quantity: 8,
      tint: color
    });

    // Auto destroy after lifespan
    this.scene.time.delayedCall(300, () => {
      emitter.destroy();
    });
  }

  playDeathEffect(x: number, y: number, color: number = PIXEL_COLORS.hpFill) {
    const emitter = this.scene.add.particles(x, y, this.pixelTexture, {
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 2, end: 0 },
      blendMode: 'NORMAL',
      lifespan: 800,
      gravityY: 0,
      quantity: 30,
      tint: color
    });

    this.scene.time.delayedCall(800, () => {
      emitter.destroy();
    });
  }
}
