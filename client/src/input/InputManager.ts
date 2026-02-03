import Phaser from 'phaser';
import { PlayerInput } from '@shared/types';

export class InputManager {
  private scene: Phaser.Scene;
  private keys: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    Q: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
  } | null = null;

  private playerPosition: { x: number; y: number } = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    if (scene.input.keyboard) {
      this.keys = {
        W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        Q: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
        E: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
        SPACE: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      };
    }
  }

  setPlayerPosition(x: number, y: number) {
    this.playerPosition = { x, y };
  }

  getInput(): PlayerInput {
    let dx = 0;
    let dy = 0;

    if (this.keys) {
      if (this.keys.A.isDown) dx -= 1;
      if (this.keys.D.isDown) dx += 1;
      if (this.keys.W.isDown) dy -= 1;
      if (this.keys.S.isDown) dy += 1;
    }

    // 归一化对角移动（防止对角移动更快）
    if (dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;
    }

    // 计算鼠标朝向角度
    const pointer = this.scene.input.activePointer;
    const camera = this.scene.cameras.main;
    const worldX = pointer.x + camera.scrollX;
    const worldY = pointer.y + camera.scrollY;
    const angle = Phaser.Math.Angle.Between(
      this.playerPosition.x,
      this.playerPosition.y,
      worldX,
      worldY
    );

    // 检测射击（鼠标左键或空格）
    const shooting = pointer.isDown || (this.keys?.SPACE.isDown ?? false);

    // 检测技能（Q 键）
    const skill = this.keys?.Q.isDown ?? false;

    return {
      dx,
      dy,
      angle,
      shooting,
      skill,
    };
  }
}
