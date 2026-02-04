import Phaser from 'phaser';
import { GAME_CONFIG } from '@shared/constants';
import { PIXEL_COLORS } from './pixel-ui';
import { getMinimapTransform, worldToMinimap, MinimapTransform } from './minimap-utils';

export interface MinimapPlayer {
  id: string;
  x: number;
  y: number;
  isLocal: boolean;
  isAlive: boolean;
}

export interface MinimapZone {
  x: number;
  y: number;
  currentRadius: number;
  targetRadius: number;
  isShrinking: boolean;
}

export class Minimap {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private graphics: Phaser.GameObjects.Graphics;
  private grid: Phaser.GameObjects.Graphics;
  private playerDots: Map<string, Phaser.GameObjects.Rectangle> = new Map();

  private readonly size: number = 150;
  private readonly padding: number = 10;
  private readonly mapWidth: number = GAME_CONFIG.MAP_WIDTH;
  private readonly mapHeight: number = GAME_CONFIG.MAP_HEIGHT;
  private readonly transform: MinimapTransform;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.transform = getMinimapTransform(this.mapWidth, this.mapHeight, this.size);

    const x = scene.cameras.main.width - this.size - this.padding;
    const y = scene.cameras.main.height - this.size - this.padding;

    this.container = scene.add.container(x, y);
    this.container.setScrollFactor(0);
    this.container.setDepth(950);

    const bg = scene.add.rectangle(0, 0, this.size, this.size, PIXEL_COLORS.panelBg, 0.9);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(2, PIXEL_COLORS.minimapBorder);
    this.container.add(bg);

    const mapArea = scene.add.rectangle(
      this.transform.offsetX,
      this.transform.offsetY,
      this.transform.displayWidth,
      this.transform.displayHeight,
      PIXEL_COLORS.panelInset,
      1
    );
    mapArea.setOrigin(0, 0);
    this.container.add(mapArea);

    this.grid = scene.add.graphics();
    this.container.add(this.grid);
    this.drawGrid();

    this.graphics = scene.add.graphics();
    this.container.add(this.graphics);
  }

  update(players: MinimapPlayer[], zone: MinimapZone) {
    this.updateZone(zone);
    this.updatePlayers(players);
  }

  private updateZone(zone: MinimapZone) {
    this.graphics.clear();

    const center = worldToMinimap(zone.x, zone.y, this.transform);
    const currentRadius = zone.currentRadius * this.transform.scale;
    const targetRadius = zone.targetRadius * this.transform.scale;

    this.graphics.fillStyle(0x7f1d1d, 0.25);
    this.graphics.fillRect(0, 0, this.size, this.size);

    this.graphics.fillStyle(PIXEL_COLORS.panelInset, 1);
    this.graphics.fillCircle(center.x, center.y, currentRadius);

    this.graphics.lineStyle(2, PIXEL_COLORS.minimapBorder, 1);
    this.graphics.strokeCircle(center.x, center.y, currentRadius);

    if (zone.isShrinking) {
      this.graphics.lineStyle(1, 0xf8fafc, 0.6);
      this.graphics.strokeCircle(center.x, center.y, targetRadius);
    }
  }

  private updatePlayers(players: MinimapPlayer[]) {
    const currentIds = new Set(players.map(p => p.id));
    this.playerDots.forEach((dot, id) => {
      if (!currentIds.has(id)) {
        dot.destroy();
        this.playerDots.delete(id);
      }
    });

    players.forEach(player => {
      if (!player.isAlive) {
        const existingDot = this.playerDots.get(player.id);
        if (existingDot) {
          existingDot.destroy();
          this.playerDots.delete(player.id);
        }
        return;
      }

      const pos = worldToMinimap(player.x, player.y, this.transform);
      const color = player.isLocal ? 0x22c55e : 0xef4444;
      const size = player.isLocal ? 4 : 3;

      let dot = this.playerDots.get(player.id);
      if (!dot) {
        dot = this.scene.add.rectangle(pos.x, pos.y, size, size, color, 1);
        dot.setOrigin(0.5);
        this.container.add(dot);
        this.playerDots.set(player.id, dot);
      } else {
        dot.setPosition(pos.x, pos.y);
      }
    });
  }

  private drawGrid() {
    this.grid.clear();
    this.grid.lineStyle(1, PIXEL_COLORS.minimapGrid, 0.4);

    const step = 12;
    for (let x = 0; x <= this.size; x += step) {
      this.grid.lineBetween(x, 0, x, this.size);
    }
    for (let y = 0; y <= this.size; y += step) {
      this.grid.lineBetween(0, y, this.size, y);
    }
  }

  setVisible(visible: boolean) {
    this.container.setVisible(visible);
  }

  destroy() {
    this.playerDots.forEach(dot => dot.destroy());
    this.playerDots.clear();
    this.graphics.destroy();
    this.grid.destroy();
    this.container.destroy();
  }
}
