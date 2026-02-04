import Phaser from 'phaser';
import { AssetGenerator } from '../utils/AssetGenerator';

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
    const generator = new AssetGenerator(this);
    generator.generateAllAssets();
  }
}
