import Phaser from 'phaser';
import {
  CHARACTER_PATTERNS,
  CHARACTER_PALETTES,
  ITEM_PATTERNS,
  ITEM_PALETTES,
  TILE_PATTERNS,
  TILE_PALETTES,
  renderPatternToGraphics,
} from '../utils/pixel-patterns';

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
    Object.entries(CHARACTER_PATTERNS).forEach(([name, patterns]) => {
      const palette = CHARACTER_PALETTES[name] || {};

      // Generate textures for each direction
      Object.entries(patterns).forEach(([dir, pattern]) => {
        const graphics = this.make.graphics({ x: 0, y: 0 });
        renderPatternToGraphics(graphics, pattern, palette, 2);
        graphics.generateTexture(`player_${name}_${dir}`, 32, 32);
        graphics.destroy();
      });

      // Create animations
      this.anims.create({
        key: `${name}_down`,
        frames: [{ key: `player_${name}_down` }],
        frameRate: 1,
      });
      this.anims.create({
        key: `${name}_up`,
        frames: [{ key: `player_${name}_up` }],
        frameRate: 1,
      });
      this.anims.create({
        key: `${name}_side`,
        frames: [{ key: `player_${name}_side` }],
        frameRate: 1,
      });
      // Note: We'll implement walking animations by toggling textures or modifying Y offset in Player.ts
      // since true frame-by-frame animation requires more patterns.
      // For now, we use the directional bases.
    });

    const bulletGraphics = this.make.graphics({ x: 0, y: 0 });
    bulletGraphics.fillStyle(0xfacc15, 1);
    bulletGraphics.fillRect(0, 0, 8, 8);
    bulletGraphics.generateTexture('bullet', 8, 8);
    bulletGraphics.destroy();

    Object.entries(ITEM_PATTERNS).forEach(([name, pattern]) => {
      const palette = ITEM_PALETTES[name] || {};
      const graphics = this.make.graphics({ x: 0, y: 0 });
      renderPatternToGraphics(graphics, pattern, palette, 1);
      graphics.generateTexture(`item_${name}`, 16, 16);
      graphics.destroy();
    });

    const tileMappings: Record<string, string> = {
      ground: 'ground',
      wall: 'wall',
      water: 'water',
      grass: 'grass',
      lava: 'sand',
    };

    Object.entries(tileMappings).forEach(([name, patternKey]) => {
      const pattern = TILE_PATTERNS[patternKey];
      const palette = TILE_PALETTES[patternKey] || {};
      const graphics = this.make.graphics({ x: 0, y: 0 });
      renderPatternToGraphics(graphics, pattern, palette, 2);
      graphics.generateTexture(`tile_${name}`, 32, 32);
      graphics.destroy();
    });

    const tileKeys = ['tile_ground', 'tile_wall', 'tile_water', 'tile_grass', 'tile_lava'];
    const tileSize = 32;
    const tilesetTexture = this.textures.createCanvas('tileset_pixel', tileKeys.length * tileSize, tileSize);
    const ctx = tilesetTexture.getContext();
    tileKeys.forEach((key, index) => {
      const source = this.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      ctx.drawImage(source, index * tileSize, 0, tileSize, tileSize);
    });
    tilesetTexture.refresh();
  }
}
