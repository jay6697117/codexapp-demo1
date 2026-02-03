import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.createLoadingUI();

    // 加载进度事件
    this.load.on('progress', (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0x00ff00, 1);
      this.progressBar.fillRect(252, 282, 300 * value, 30);
      this.loadingText.setText(`加载中... ${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      this.progressBar.destroy();
      this.progressBox.destroy();
      this.loadingText.destroy();
    });

    // 生成占位符精灵图
    this.createPlaceholderAssets();
  }

  create() {
    // 资源加载完成，切换到菜单场景
    this.scene.start('MenuScene');
  }

  private createLoadingUI() {
    const { width, height } = this.cameras.main;

    // 进度条背景
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(240, 270, 320, 50);

    // 进度条
    this.progressBar = this.add.graphics();

    // 加载文字
    this.loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {
      fontSize: '24px',
      color: '#ffffff',
    });
    this.loadingText.setOrigin(0.5);

    // 标题
    const title = this.add.text(width / 2, 150, 'PIXEL ARENA', {
      fontSize: '64px',
      color: '#00ff00',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
  }

  private createPlaceholderAssets() {
    // 生成玩家精灵占位符 (32x32 彩色方块)
    const playerColors: Record<string, number> = {
      assault: 0x00ff00,
      tank: 0x0000ff,
      ranger: 0xff00ff,
      medic: 0x00ffff,
    };

    Object.entries(playerColors).forEach(([name, color]) => {
      const graphics = this.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, 0, 32, 32);
      // 添加边框使角色更明显
      graphics.lineStyle(2, 0xffffff, 1);
      graphics.strokeRect(0, 0, 32, 32);
      graphics.generateTexture(`player_${name}`, 32, 32);
      graphics.destroy();
    });

    // 生成子弹占位符 (8x8 黄色方块)
    const bulletGraphics = this.make.graphics({ x: 0, y: 0 });
    bulletGraphics.fillStyle(0xffff00, 1);
    bulletGraphics.fillRect(0, 0, 8, 8);
    bulletGraphics.generateTexture('bullet', 8, 8);
    bulletGraphics.destroy();

    // 生成道具占位符 (24x24 白色方块)
    const itemGraphics = this.make.graphics({ x: 0, y: 0 });
    itemGraphics.fillStyle(0xffffff, 1);
    itemGraphics.fillRect(0, 0, 24, 24);
    itemGraphics.lineStyle(2, 0xffff00, 1);
    itemGraphics.strokeRect(0, 0, 24, 24);
    itemGraphics.generateTexture('item', 24, 24);
    itemGraphics.destroy();

    // 生成地图瓦片占位符
    const tileColors: Record<string, number> = {
      ground: 0x3d3d3d,
      wall: 0x666666,
      water: 0x4444ff,
      grass: 0x228b22,
      lava: 0xff4500,
    };

    Object.entries(tileColors).forEach(([name, color]) => {
      const graphics = this.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, 0, 32, 32);
      // 添加网格线
      graphics.lineStyle(1, 0x000000, 0.3);
      graphics.strokeRect(0, 0, 32, 32);
      graphics.generateTexture(`tile_${name}`, 32, 32);
      graphics.destroy();
    });
  }
}
