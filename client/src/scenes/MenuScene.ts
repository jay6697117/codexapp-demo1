import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // 标题
    const title = this.add.text(width / 2, 100, 'PIXEL ARENA', {
      fontSize: '48px',
      color: '#00ff00',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // 副标题
    const subtitle = this.add.text(width / 2, 160, '像素竞技场', {
      fontSize: '24px',
      color: '#888888',
    });
    subtitle.setOrigin(0.5);

    // 开始按钮
    const startButton = this.add.text(width / 2, height / 2, '[ 开始游戏 ]', {
      fontSize: '32px',
      color: '#ffffff',
      padding: { x: 20, y: 10 },
    });
    startButton.setOrigin(0.5);
    startButton.setInteractive({ useHandCursor: true });

    startButton.on('pointerover', () => {
      startButton.setColor('#00ff00');
      startButton.setScale(1.1);
    });

    startButton.on('pointerout', () => {
      startButton.setColor('#ffffff');
      startButton.setScale(1);
    });

    startButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // 操作说明
    const instructions = this.add.text(width / 2, height - 100,
      'WASD 移动 | 鼠标瞄准 | 左键射击 | Q 技能', {
      fontSize: '16px',
      color: '#666666',
    });
    instructions.setOrigin(0.5);

    // 版本号
    this.add.text(10, height - 30, 'v0.1.0', {
      fontSize: '14px',
      color: '#444444',
    });
  }
}
