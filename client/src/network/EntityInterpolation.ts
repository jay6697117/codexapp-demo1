import Phaser from 'phaser';

export interface PositionSnapshot {
  x: number;
  y: number;
  rotation: number;
  timestamp: number;
}

export class EntityInterpolation {
  private snapshots: PositionSnapshot[] = [];
  private readonly maxSnapshots: number = 20;
  private readonly interpolationDelay: number = 100; // 100ms 延迟用于平滑

  constructor() {}

  /**
   * 添加新的位置快照
   */
  addSnapshot(x: number, y: number, rotation: number, timestamp?: number): void {
    const snapshot: PositionSnapshot = {
      x,
      y,
      rotation,
      timestamp: timestamp ?? Date.now(),
    };

    this.snapshots.push(snapshot);

    // 限制快照数量
    while (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  /**
   * 获取插值后的位置
   */
  getInterpolatedPosition(currentTime?: number): PositionSnapshot | null {
    if (this.snapshots.length < 2) {
      return this.snapshots[0] ?? null;
    }

    const renderTime = (currentTime ?? Date.now()) - this.interpolationDelay;

    // 找到两个用于插值的快照
    let older: PositionSnapshot | null = null;
    let newer: PositionSnapshot | null = null;

    for (let i = 0; i < this.snapshots.length - 1; i++) {
      if (this.snapshots[i].timestamp <= renderTime && this.snapshots[i + 1].timestamp >= renderTime) {
        older = this.snapshots[i];
        newer = this.snapshots[i + 1];
        break;
      }
    }

    // 如果没找到合适的快照对，返回最新的快照
    if (!older || !newer) {
      return this.snapshots[this.snapshots.length - 1];
    }

    // 计算插值因子
    const totalTime = newer.timestamp - older.timestamp;
    const elapsedTime = renderTime - older.timestamp;
    const t = totalTime > 0 ? Phaser.Math.Clamp(elapsedTime / totalTime, 0, 1) : 0;

    // 线性插值位置
    const x = Phaser.Math.Linear(older.x, newer.x, t);
    const y = Phaser.Math.Linear(older.y, newer.y, t);

    // 角度插值（处理角度环绕）
    const rotation = this.lerpAngle(older.rotation, newer.rotation, t);

    return { x, y, rotation, timestamp: renderTime };
  }

  /**
   * 角度插值（处理 0 和 2π 之间的环绕）
   */
  private lerpAngle(a: number, b: number, t: number): number {
    let diff = b - a;

    // 处理角度环绕
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    return a + diff * t;
  }

  /**
   * 外推位置（用于预测未来位置）
   */
  getExtrapolatedPosition(deltaMs: number): PositionSnapshot | null {
    if (this.snapshots.length < 2) {
      return this.snapshots[this.snapshots.length - 1] ?? null;
    }

    const latest = this.snapshots[this.snapshots.length - 1];
    const previous = this.snapshots[this.snapshots.length - 2];

    const dt = latest.timestamp - previous.timestamp;
    if (dt <= 0) return latest;

    const velocityX = (latest.x - previous.x) / dt;
    const velocityY = (latest.y - previous.y) / dt;
    const angularVelocity = (latest.rotation - previous.rotation) / dt;

    return {
      x: latest.x + velocityX * deltaMs,
      y: latest.y + velocityY * deltaMs,
      rotation: latest.rotation + angularVelocity * deltaMs,
      timestamp: latest.timestamp + deltaMs,
    };
  }

  /**
   * 清空所有快照
   */
  clear(): void {
    this.snapshots = [];
  }

  /**
   * 获取快照数量
   */
  getSnapshotCount(): number {
    return this.snapshots.length;
  }

  /**
   * 获取最新快照
   */
  getLatestSnapshot(): PositionSnapshot | null {
    return this.snapshots[this.snapshots.length - 1] ?? null;
  }
}
