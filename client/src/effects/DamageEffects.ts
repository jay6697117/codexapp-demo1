import Phaser from 'phaser';

export class DamageEffects {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // 伤害数字飘字
  showDamageNumber(x: number, y: number, damage: number, isCritical: boolean = false) {
    const text = this.scene.add.text(x, y - 20, `-${damage}`, {
      fontSize: isCritical ? '20px' : '14px',
      color: isCritical ? '#ff0000' : '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);

    this.scene.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  // 受击闪烁效果
  playHitFlash(target: Phaser.GameObjects.Container) {
    const sprite = target.list.find(
      (child) => child instanceof Phaser.GameObjects.Image
    ) as Phaser.GameObjects.Image;

    if (sprite) {
      sprite.setTint(0xff0000);
      this.scene.time.delayedCall(100, () => {
        sprite.clearTint();
      });
    }
  }

  // 死亡效果
  playDeathEffect(x: number, y: number) {
    // 爆炸粒子效果
    for (let i = 0; i < 8; i++) {
      const particle = this.scene.add.graphics();
      particle.fillStyle(0xff0000, 1);
      particle.fillCircle(0, 0, 4);
      particle.setPosition(x, y);

      const angle = (Math.PI * 2 * i) / 8;
      const distance = 50;

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.5,
        duration: 500,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }

    // 死亡文字
    const deathText = this.scene.add.text(x, y, 'X', {
      fontSize: '32px',
      color: '#ff0000',
      fontStyle: 'bold',
    });
    deathText.setOrigin(0.5);

    this.scene.tweens.add({
      targets: deathText,
      y: y - 40,
      alpha: 0,
      duration: 1000,
      onComplete: () => deathText.destroy(),
    });
  }

  // 治疗效果
  showHealNumber(x: number, y: number, amount: number) {
    const text = this.scene.add.text(x, y - 20, `+${amount}`, {
      fontSize: '14px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);

    this.scene.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy(),
    });
  }
}
