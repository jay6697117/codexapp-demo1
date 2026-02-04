import Phaser from 'phaser';
import { GAME_CONFIG } from '@shared/constants';

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
  private playerDots: Map<string, Phaser.GameObjects.Arc> = new Map();

  private readonly size: number = 150;
  private readonly padding: number = 10;
  private readonly mapWidth: number = GAME_CONFIG.MAP_WIDTH;
  private readonly mapHeight: number = GAME_CONFIG.MAP_HEIGHT;
  private readonly scale: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.scale = this.size / Math.max(this.mapWidth, this.mapHeight);

    // Position in bottom-right corner
    const x = scene.cameras.main.width - this.size - this.padding;
    const y = scene.cameras.main.height - this.size - this.padding;

    this.container = scene.add.container(x, y);
    this.container.setScrollFactor(0);
    this.container.setDepth(950);

    // Background
    const bg = scene.add.rectangle(0, 0, this.size, this.size, 0x000000, 0.6);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(2, 0x444444);
    this.container.add(bg);

    // Map area (proportionally scaled)
    const mapDisplayWidth = this.mapWidth * this.scale;
    const mapDisplayHeight = this.mapHeight * this.scale;
    const mapOffsetX = (this.size - mapDisplayWidth) / 2;
    const mapOffsetY = (this.size - mapDisplayHeight) / 2;

    const mapArea = scene.add.rectangle(
      mapOffsetX,
      mapOffsetY,
      mapDisplayWidth,
      mapDisplayHeight,
      0x1a1a2e,
      0.8
    );
    mapArea.setOrigin(0, 0);
    this.container.add(mapArea);

    // Graphics layer for drawing safe zone
    this.graphics = scene.add.graphics();
    this.container.add(this.graphics);
  }

  update(players: MinimapPlayer[], zone: MinimapZone) {
    this.updateZone(zone);
    this.updatePlayers(players);
  }

  private updateZone(zone: MinimapZone) {
    this.graphics.clear();

    const centerX = this.worldToMinimapX(zone.x);
    const centerY = this.worldToMinimapY(zone.y);
    const currentRadius = zone.currentRadius * this.scale;
    const targetRadius = zone.targetRadius * this.scale;

    // Draw danger zone (red fill outside safe zone)
    this.graphics.fillStyle(0xff0000, 0.3);
    this.graphics.fillRect(0, 0, this.size, this.size);

    // Clear the red inside safe zone
    this.graphics.fillStyle(0x1a1a2e, 1);
    this.graphics.fillCircle(centerX, centerY, currentRadius);

    // Current safe zone border (blue)
    this.graphics.lineStyle(2, 0x00aaff, 0.8);
    this.graphics.strokeCircle(centerX, centerY, currentRadius);

    // If shrinking, show target zone (white dashed effect)
    if (zone.isShrinking) {
      this.graphics.lineStyle(1, 0xffffff, 0.5);
      this.graphics.strokeCircle(centerX, centerY, targetRadius);
    }
  }

  private updatePlayers(players: MinimapPlayer[]) {
    // Remove dots for players that no longer exist
    const currentIds = new Set(players.map(p => p.id));
    this.playerDots.forEach((dot, id) => {
      if (!currentIds.has(id)) {
        dot.destroy();
        this.playerDots.delete(id);
      }
    });

    // Update or create player dots
    players.forEach(player => {
      if (!player.isAlive) {
        const existingDot = this.playerDots.get(player.id);
        if (existingDot) {
          existingDot.destroy();
          this.playerDots.delete(player.id);
        }
        return;
      }

      const x = this.worldToMinimapX(player.x);
      const y = this.worldToMinimapY(player.y);
      const color = player.isLocal ? 0x00ff00 : 0xff0000;
      const size = player.isLocal ? 4 : 3;

      let dot = this.playerDots.get(player.id);
      if (!dot) {
        dot = this.scene.add.arc(x, y, size, 0, 360, false, color);
        dot.setOrigin(0.5);
        this.container.add(dot);
        this.playerDots.set(player.id, dot);
      } else {
        dot.setPosition(x, y);
      }
    });
  }

  private worldToMinimapX(worldX: number): number {
    const mapDisplayWidth = this.mapWidth * this.scale;
    const mapOffsetX = (this.size - mapDisplayWidth) / 2;
    return mapOffsetX + worldX * this.scale;
  }

  private worldToMinimapY(worldY: number): number {
    const mapDisplayHeight = this.mapHeight * this.scale;
    const mapOffsetY = (this.size - mapDisplayHeight) / 2;
    return mapOffsetY + worldY * this.scale;
  }

  setVisible(visible: boolean) {
    this.container.setVisible(visible);
  }

  destroy() {
    this.playerDots.forEach(dot => dot.destroy());
    this.playerDots.clear();
    this.graphics.destroy();
    this.container.destroy();
  }
}
