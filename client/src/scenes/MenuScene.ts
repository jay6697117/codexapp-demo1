import Phaser from 'phaser';
import { networkManager } from '../network';

export class MenuScene extends Phaser.Scene {
  private connectingText?: Phaser.GameObjects.Text;

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

    // 单人游戏按钮
    const singlePlayerButton = this.add.text(width / 2, height / 2 - 40, '[ 单人游戏 ]', {
      fontSize: '32px',
      color: '#ffffff',
      padding: { x: 20, y: 10 },
    });
    singlePlayerButton.setOrigin(0.5);
    singlePlayerButton.setInteractive({ useHandCursor: true });

    singlePlayerButton.on('pointerover', () => {
      singlePlayerButton.setColor('#00ff00');
      singlePlayerButton.setScale(1.1);
    });

    singlePlayerButton.on('pointerout', () => {
      singlePlayerButton.setColor('#ffffff');
      singlePlayerButton.setScale(1);
    });

    singlePlayerButton.on('pointerdown', () => {
      this.scene.start('GameScene', { multiplayer: false });
    });

    // 多人游戏按钮
    const multiPlayerButton = this.add.text(width / 2, height / 2 + 40, '[ 多人游戏 ]', {
      fontSize: '32px',
      color: '#ffffff',
      padding: { x: 20, y: 10 },
    });
    multiPlayerButton.setOrigin(0.5);
    multiPlayerButton.setInteractive({ useHandCursor: true });

    multiPlayerButton.on('pointerover', () => {
      multiPlayerButton.setColor('#00ffff');
      multiPlayerButton.setScale(1.1);
    });

    multiPlayerButton.on('pointerout', () => {
      multiPlayerButton.setColor('#ffffff');
      multiPlayerButton.setScale(1);
    });

    multiPlayerButton.on('pointerdown', () => {
      this.startMultiplayerGame();
    });

    // 连接中提示（初始隐藏）
    this.connectingText = this.add.text(width / 2, height / 2 + 120, '连接服务器中...', {
      fontSize: '18px',
      color: '#ffaa00',
    });
    this.connectingText.setOrigin(0.5);
    this.connectingText.setVisible(false);

    // 操作说明
    const instructions = this.add.text(width / 2, height - 100,
      'WASD 移动 | 鼠标瞄准 | 左键射击 | Q 技能', {
      fontSize: '16px',
      color: '#666666',
    });
    instructions.setOrigin(0.5);

    // 版本号
    this.add.text(10, height - 30, 'v0.2.0', {
      fontSize: '14px',
      color: '#444444',
    });
  }

  private async startMultiplayerGame() {
    if (!this.connectingText) return;

    this.connectingText.setVisible(true);
    this.connectingText.setText('连接服务器中...');
    this.connectingText.setColor('#ffaa00');

    try {
      // 连接到服务器
      await networkManager.joinOrCreate({
        name: 'Player_' + Math.floor(Math.random() * 10000),
        character: 'assault',
      });

      this.connectingText.setText('连接成功!');
      this.connectingText.setColor('#00ff00');

      // 短暂显示成功信息后进入游戏
      this.time.delayedCall(500, () => {
        this.scene.start('GameScene', { multiplayer: true });
      });
    } catch (error) {
      console.error('Failed to connect:', error);
      this.connectingText.setText('连接失败，请重试');
      this.connectingText.setColor('#ff0000');

      // 3秒后隐藏错误信息
      this.time.delayedCall(3000, () => {
        if (this.connectingText) {
          this.connectingText.setVisible(false);
        }
      });
    }
  }
}
