import Phaser from 'phaser';

export class TextureGenerator {
  static createTextures(scene: Phaser.Scene) {
    this.createPunkTexture(scene);
    this.createDogeTexture(scene);
    this.createChadTexture(scene);
    this.createOriginalTexture(scene);
  }

  private static createPunkTexture(scene: Phaser.Scene) {
    if (scene.textures.exists('char_punk')) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Base (Cyan Skin)
    g.fillStyle(0x00ffff);
    g.fillRect(8, 8, 16, 24);

    // Mohawk (Pink)
    g.fillStyle(0xff00ff);
    g.fillRect(12, 0, 8, 8);

    // Shades (Black)
    g.fillStyle(0x000000);
    g.fillRect(10, 12, 12, 4);

    g.generateTexture('char_punk', 32, 32);
  }

  private static createDogeTexture(scene: Phaser.Scene) {
    if (scene.textures.exists('char_doge')) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Base (Golden/Yellow)
    g.fillStyle(0xffcc00);
    g.fillRect(4, 8, 24, 20);

    // Ears
    g.fillStyle(0xffaa00);
    g.fillRect(4, 4, 6, 6);
    g.fillRect(22, 4, 6, 6);

    // Snout (White)
    g.fillStyle(0xffffff);
    g.fillRect(10, 16, 12, 8);

    // Nose (Black)
    g.fillStyle(0x000000);
    g.fillRect(14, 18, 4, 4);

    g.generateTexture('char_doge', 32, 32);
  }

  private static createChadTexture(scene: Phaser.Scene) {
    if (scene.textures.exists('char_chad')) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Skin (Tan)
    g.fillStyle(0xffccaa);
    g.fillRect(6, 4, 20, 24);

    // Hair (Blonde)
    g.fillStyle(0xffff00);
    g.fillRect(6, 0, 20, 6);
    g.fillRect(4, 2, 4, 8); // Sidebums

    // Jaw (Strong!)
    g.fillStyle(0xffccaa);
    g.fillRect(6, 24, 20, 4);

    // Shades (Black - typical Chad meme often has them or just cool eyes)
    g.fillStyle(0x000000);
    g.fillRect(8, 10, 4, 4);
    g.fillRect(20, 10, 4, 4);

    // Beard stubble
    g.fillStyle(0xcc9988);
    g.fillRect(8, 22, 16, 6);

    g.generateTexture('char_chad', 32, 32);
  }

  private static createOriginalTexture(scene: Phaser.Scene) {
    if (scene.textures.exists('char_original')) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x00ff00);
    g.fillRect(0, 0, 32, 32);
    g.generateTexture('char_original', 32, 32);
  }

  static createMapTextures(scene: Phaser.Scene) {
    if (scene.textures.exists('tile_floor')) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Dark Stone Floor
    g.fillStyle(0x222233);
    g.fillRect(0, 0, 64, 64);

    // Highlights (cracks/details)
    g.fillStyle(0x333344);
    g.fillRect(2, 2, 60, 2);
    g.fillRect(2, 2, 2, 60);

    // Random noise hint
    g.fillStyle(0x2a2a3a);
    g.fillRect(10, 10, 10, 10);
    g.fillRect(40, 40, 15, 8);

    g.generateTexture('tile_floor', 64, 64);
  }
}
