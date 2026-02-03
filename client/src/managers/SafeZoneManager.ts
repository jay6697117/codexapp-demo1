import Phaser from 'phaser';
import { GAME_CONFIG, SAFE_ZONE } from '@shared/constants';

export interface ZoneState {
  x: number;
  y: number;
  currentRadius: number;
  targetRadius: number;
  phase: number;
  damage: number;
  isShrinking: boolean;
  timeToNextPhase: number;
}

export class SafeZoneManager {
  private scene: Phaser.Scene;
  private zoneGraphics: Phaser.GameObjects.Graphics;
  private dangerZoneGraphics: Phaser.GameObjects.Graphics;

  private centerX: number;
  private centerY: number;
  private currentRadius: number;
  private targetRadius: number;
  private currentPhase: number = 0;
  private currentDamage: number = 0;
  private isShrinking: boolean = false;
  private shrinkStartTime: number = 0;
  private shrinkStartRadius: number = 0;

  private gameStartTime: number = 0;
  private isRunning: boolean = false;

  // Target center for shrinking animation
  private targetCenterX: number;
  private targetCenterY: number;
  private startCenterX: number;
  private startCenterY: number;

  // Maximum radius (half of diagonal)
  private maxRadius: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Safe zone center (map center)
    this.centerX = GAME_CONFIG.MAP_WIDTH / 2;
    this.centerY = GAME_CONFIG.MAP_HEIGHT / 2;
    this.targetCenterX = this.centerX;
    this.targetCenterY = this.centerY;
    this.startCenterX = this.centerX;
    this.startCenterY = this.centerY;

    // Maximum radius covers entire map
    this.maxRadius = Math.sqrt(
      Math.pow(GAME_CONFIG.MAP_WIDTH / 2, 2) +
      Math.pow(GAME_CONFIG.MAP_HEIGHT / 2, 2)
    );

    this.currentRadius = this.maxRadius;
    this.targetRadius = this.maxRadius;

    // Create graphics layers
    this.dangerZoneGraphics = scene.add.graphics();
    this.dangerZoneGraphics.setDepth(100);

    this.zoneGraphics = scene.add.graphics();
    this.zoneGraphics.setDepth(101);
  }

  start() {
    this.gameStartTime = Date.now();
    this.isRunning = true;
    this.currentPhase = 0;
    this.currentRadius = this.maxRadius;
    this.targetRadius = this.maxRadius;
    this.currentDamage = 0;
    this.centerX = GAME_CONFIG.MAP_WIDTH / 2;
    this.centerY = GAME_CONFIG.MAP_HEIGHT / 2;
    this.targetCenterX = this.centerX;
    this.targetCenterY = this.centerY;
  }

  stop() {
    this.isRunning = false;
  }

  update(): ZoneState {
    if (!this.isRunning) {
      return this.getState();
    }

    const elapsed = Date.now() - this.gameStartTime;

    // Check if need to transition to next phase
    this.checkPhaseTransition(elapsed);

    // Handle shrinking animation
    if (this.isShrinking) {
      this.updateShrinking();
    }

    // Draw safe zone
    this.draw();

    return this.getState();
  }

  private checkPhaseTransition(elapsed: number) {
    const phases = SAFE_ZONE.phases;

    for (let i = phases.length - 1; i >= 0; i--) {
      if (elapsed >= phases[i].time && this.currentPhase < i) {
        this.startPhase(i);
        break;
      }
    }
  }

  private startPhase(phaseIndex: number) {
    const phase = SAFE_ZONE.phases[phaseIndex];
    this.currentPhase = phaseIndex;
    this.currentDamage = phase.damage;

    // Start shrinking
    this.isShrinking = true;
    this.shrinkStartTime = Date.now();
    this.shrinkStartRadius = this.currentRadius;
    this.targetRadius = this.maxRadius * phase.radiusPercent;

    // Store start center for interpolation
    this.startCenterX = this.centerX;
    this.startCenterY = this.centerY;

    // Random offset center point (each shrink center moves slightly)
    if (phaseIndex > 0) {
      const offsetRange = this.targetRadius * 0.3;
      this.targetCenterX = GAME_CONFIG.MAP_WIDTH / 2 + (Math.random() - 0.5) * offsetRange;
      this.targetCenterY = GAME_CONFIG.MAP_HEIGHT / 2 + (Math.random() - 0.5) * offsetRange;

      // Ensure center point doesn't get too close to boundary
      this.targetCenterX = Phaser.Math.Clamp(
        this.targetCenterX,
        this.targetRadius + 50,
        GAME_CONFIG.MAP_WIDTH - this.targetRadius - 50
      );
      this.targetCenterY = Phaser.Math.Clamp(
        this.targetCenterY,
        this.targetRadius + 50,
        GAME_CONFIG.MAP_HEIGHT - this.targetRadius - 50
      );
    }
  }

  private updateShrinking() {
    const elapsed = Date.now() - this.shrinkStartTime;
    const progress = Math.min(1, elapsed / SAFE_ZONE.shrinkDuration);

    // Linear interpolation for radius
    this.currentRadius = Phaser.Math.Linear(
      this.shrinkStartRadius,
      this.targetRadius,
      progress
    );

    // Linear interpolation for center position
    this.centerX = Phaser.Math.Linear(
      this.startCenterX,
      this.targetCenterX,
      progress
    );
    this.centerY = Phaser.Math.Linear(
      this.startCenterY,
      this.targetCenterY,
      progress
    );

    if (progress >= 1) {
      this.isShrinking = false;
      this.currentRadius = this.targetRadius;
      this.centerX = this.targetCenterX;
      this.centerY = this.targetCenterY;
    }
  }

  private draw() {
    // Clear previous drawings
    this.zoneGraphics.clear();
    this.dangerZoneGraphics.clear();

    // Draw danger zone (red semi-transparent covering entire map, except safe zone)
    // We use a mask approach: draw full red overlay, then use blendMode to clear safe area
    this.dangerZoneGraphics.fillStyle(0xff0000, 0.15);
    this.dangerZoneGraphics.fillRect(0, 0, GAME_CONFIG.MAP_WIDTH, GAME_CONFIG.MAP_HEIGHT);

    // Create a "hole" for the safe zone by drawing over it with destination-out
    // Since Phaser Graphics doesn't support direct masking easily, we draw the safe zone
    // as a semi-transparent overlay effect instead

    // Draw safe zone border (blue circle)
    this.zoneGraphics.lineStyle(4, 0x00aaff, 0.9);
    this.zoneGraphics.strokeCircle(this.centerX, this.centerY, this.currentRadius);

    // Add inner glow effect
    this.zoneGraphics.lineStyle(8, 0x00aaff, 0.3);
    this.zoneGraphics.strokeCircle(this.centerX, this.centerY, this.currentRadius - 4);

    // If shrinking, draw target zone (white dashed circle effect)
    if (this.isShrinking) {
      this.zoneGraphics.lineStyle(2, 0xffffff, 0.6);
      this.zoneGraphics.strokeCircle(this.targetCenterX, this.targetCenterY, this.targetRadius);

      // Draw connecting line from current center to target center
      this.zoneGraphics.lineStyle(1, 0xffffff, 0.3);
      this.zoneGraphics.lineBetween(
        this.centerX,
        this.centerY,
        this.targetCenterX,
        this.targetCenterY
      );
    }

    // Draw danger zone edge effect (pulsing red at the boundary)
    const pulseAlpha = 0.3 + Math.sin(Date.now() / 200) * 0.1;
    this.dangerZoneGraphics.lineStyle(6, 0xff0000, pulseAlpha);
    this.dangerZoneGraphics.strokeCircle(this.centerX, this.centerY, this.currentRadius + 3);
  }

  // Check if point is inside safe zone
  isInsideSafeZone(x: number, y: number): boolean {
    const distance = Phaser.Math.Distance.Between(x, y, this.centerX, this.centerY);
    return distance <= this.currentRadius;
  }

  // Get current damage value
  getDamage(): number {
    return this.currentDamage;
  }

  // Get distance to safe zone edge (negative if inside, positive if outside)
  getDistanceToEdge(x: number, y: number): number {
    const distance = Phaser.Math.Distance.Between(x, y, this.centerX, this.centerY);
    return distance - this.currentRadius;
  }

  getState(): ZoneState {
    const elapsed = this.isRunning ? Date.now() - this.gameStartTime : 0;
    const nextPhase = SAFE_ZONE.phases[this.currentPhase + 1];
    const timeToNextPhase = nextPhase ? Math.max(0, nextPhase.time - elapsed) : 0;

    return {
      x: this.centerX,
      y: this.centerY,
      currentRadius: this.currentRadius,
      targetRadius: this.targetRadius,
      phase: this.currentPhase,
      damage: this.currentDamage,
      isShrinking: this.isShrinking,
      timeToNextPhase,
    };
  }

  // Get center position
  getCenter(): { x: number; y: number } {
    return { x: this.centerX, y: this.centerY };
  }

  // Get current radius
  getCurrentRadius(): number {
    return this.currentRadius;
  }

  destroy() {
    this.zoneGraphics.destroy();
    this.dangerZoneGraphics.destroy();
  }
}
