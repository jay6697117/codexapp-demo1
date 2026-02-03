import Phaser from 'phaser';
import { SkillType } from '../managers/SkillManager';

export class SkillEffects {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // 冲刺效果：残影
  playDashEffect(x: number, y: number, angle: number) {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x00ff00, 0.5);
    graphics.fillCircle(x, y, 16);

    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      scale: 1.5,
      duration: 300,
      onComplete: () => graphics.destroy(),
    });
  }

  // 护盾效果：圆形护盾
  createShieldEffect(target: Phaser.GameObjects.Container): Phaser.GameObjects.Graphics {
    const shield = this.scene.add.graphics();
    shield.lineStyle(3, 0x0088ff, 0.8);
    shield.strokeCircle(0, 0, 28);
    shield.fillStyle(0x0088ff, 0.2);
    shield.fillCircle(0, 0, 28);
    target.add(shield);

    // 旋转动画
    this.scene.tweens.add({
      targets: shield,
      rotation: Math.PI * 2,
      duration: 2000,
      repeat: -1,
    });

    return shield;
  }

  // 后空翻效果：翻转动画
  playBackflipEffect(target: Phaser.GameObjects.Container, angle: number) {
    const startX = target.x;
    const startY = target.y;
    const distance = 80;
    const endX = startX - Math.cos(angle) * distance;
    const endY = startY - Math.sin(angle) * distance;

    this.scene.tweens.add({
      targets: target,
      x: endX,
      y: endY,
      duration: 300,
      ease: 'Quad.easeOut',
    });
  }

  // 治疗光环效果：绿色光环
  createHealAuraEffect(target: Phaser.GameObjects.Container): Phaser.GameObjects.Graphics {
    const aura = this.scene.add.graphics();
    aura.lineStyle(2, 0x00ffff, 0.6);
    aura.strokeCircle(0, 0, 50);
    aura.fillStyle(0x00ffff, 0.1);
    aura.fillCircle(0, 0, 50);
    target.add(aura);

    // 脉冲动画
    this.scene.tweens.add({
      targets: aura,
      scale: { from: 0.8, to: 1.2 },
      alpha: { from: 0.6, to: 0.2 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    return aura;
  }
}
