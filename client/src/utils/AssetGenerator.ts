import Phaser from 'phaser';
import {
  CHARACTER_PATTERNS,
  CHARACTER_PALETTES,
  ITEM_PATTERNS,
  ITEM_PALETTES,
  TILE_PATTERNS,
  TILE_PALETTES,
  renderPatternToGraphics,
} from './pixel-patterns';

export class AssetGenerator {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  generateAllAssets() {
    this.generateCharacterTextures();
    this.generateBulletTexture();
    this.generateItemTextures();
    this.generateTileTextures();
  }

  private generateCharacterTextures() {
    Object.entries(CHARACTER_PATTERNS).forEach(([name, patterns]) => {
      const palette = CHARACTER_PALETTES[name] || {};

      // Generate textures for each direction
      Object.entries(patterns).forEach(([dir, pattern]) => {
        const key = `player_${name}_${dir}`;
        if (this.scene.textures.exists(key)) return;

        const graphics = this.scene.make.graphics({ x: 0, y: 0 });
        renderPatternToGraphics(graphics, pattern, palette, 2);
        graphics.generateTexture(key, 32, 32);
        graphics.destroy();
      });

      // Create animations
      this.createAnimation(`${name}_down`, `player_${name}_down`);
      this.createAnimation(`${name}_up`, `player_${name}_up`);
      this.createAnimation(`${name}_side`, `player_${name}_side`);
    });
  }

  private createAnimation(key: string, textureKey: string) {
    if (this.scene.anims.exists(key)) return;

    this.scene.anims.create({
      key: key,
      frames: [{ key: textureKey }],
      frameRate: 1,
    });
  }

  private generateBulletTexture() {
    if (this.scene.textures.exists('bullet')) return;

    const bulletGraphics = this.scene.make.graphics({ x: 0, y: 0 });
    bulletGraphics.fillStyle(0xfacc15, 1);
    bulletGraphics.fillRect(0, 0, 8, 8);
    bulletGraphics.generateTexture('bullet', 8, 8);
    bulletGraphics.destroy();
  }

  private generateItemTextures() {
    Object.entries(ITEM_PATTERNS).forEach(([name, pattern]) => {
      const key = `item_${name}`;
      if (this.scene.textures.exists(key)) return;

      const palette = ITEM_PALETTES[name] || {};
      const graphics = this.scene.make.graphics({ x: 0, y: 0 });
      renderPatternToGraphics(graphics, pattern, palette, 1);
      graphics.generateTexture(key, 16, 16);
      graphics.destroy();
    });
  }

  private generateTileTextures() {
    const tileMappings: Record<string, string> = {
      ground: 'ground',
      wall: 'wall',
      water: 'water',
      grass: 'grass',
      lava: 'sand',
    };

    Object.entries(tileMappings).forEach(([name, patternKey]) => {
      const key = `tile_${name}`;
      if (this.scene.textures.exists(key)) return;

      const pattern = TILE_PATTERNS[patternKey];
      const palette = TILE_PALETTES[patternKey] || {};
      const graphics = this.scene.make.graphics({ x: 0, y: 0 });
      renderPatternToGraphics(graphics, pattern, palette, 2);
      graphics.generateTexture(key, 32, 32);
      graphics.destroy();
    });

    // Generate Composite Tileset
    if (this.scene.textures.exists('tileset_pixel')) return;

    const tileKeys = ['tile_ground', 'tile_wall', 'tile_water', 'tile_grass', 'tile_lava'];
    const tileSize = 32;
    // We need to wait for textures to be available if we were loading them async,
    // but since we just generated them synchronously, we can proceed.

    // Note: In Phaser, generateTexture is usually synchronous for Graphics,
    // but internally it might take a tick. However, usually it's fine.
    // If issues arise, we might need to handle this differently.

    const tilesetTexture = this.scene.textures.createCanvas('tileset_pixel', tileKeys.length * tileSize, tileSize);
    if (!tilesetTexture) return;

    const ctx = tilesetTexture.getContext();
    tileKeys.forEach((key, index) => {
      const texture = this.scene.textures.get(key);
      const source = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      ctx.drawImage(source, index * tileSize, 0, tileSize, tileSize);
    });
    tilesetTexture.refresh();
  }
}
