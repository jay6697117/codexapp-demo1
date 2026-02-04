import Phaser from 'phaser';

export interface InputSnapshot {
  sequence: number;
  timestamp: number;
  dx: number;
  dy: number;
  x: number;
  y: number;
}

export interface ServerState {
  x: number;
  y: number;
  sequence: number;
  timestamp: number;
}

export class ClientPrediction {
  private pendingInputs: InputSnapshot[] = [];
  private sequence: number = 0;
  private readonly maxPendingInputs: number = 60; // 1秒的输入历史
  private readonly reconciliationThreshold: number = 5; // 误差阈值（像素）

  constructor() {}

  /**
   * 记录一次输入，返回序列号用于发送到服务器
   */
  recordInput(dx: number, dy: number, currentX: number, currentY: number): InputSnapshot {
    const input: InputSnapshot = {
      sequence: ++this.sequence,
      timestamp: Date.now(),
      dx,
      dy,
      x: currentX,
      y: currentY,
    };

    this.pendingInputs.push(input);

    // 限制历史长度
    if (this.pendingInputs.length > this.maxPendingInputs) {
      this.pendingInputs.shift();
    }

    return input;
  }

  /**
   * 获取当前序列号
   */
  getSequence(): number {
    return this.sequence;
  }

  /**
   * 服务器状态调和
   * 返回调和后的位置，如果不需要调和则返回 null
   */
  reconcile(serverState: ServerState, speed: number, deltaMs: number): { x: number; y: number } | null {
    // 移除已确认的输入
    this.pendingInputs = this.pendingInputs.filter(
      input => input.sequence > serverState.sequence
    );

    // 如果没有待处理的输入，直接使用服务器状态
    if (this.pendingInputs.length === 0) {
      return { x: serverState.x, y: serverState.y };
    }

    // 从服务器状态开始，重新应用未确认的输入
    let predictedX = serverState.x;
    let predictedY = serverState.y;

    for (const input of this.pendingInputs) {
      const moveDistance = speed * (deltaMs / 1000);
      predictedX += input.dx * moveDistance;
      predictedY += input.dy * moveDistance;
    }

    return { x: predictedX, y: predictedY };
  }

  /**
   * 检查是否需要调和
   */
  needsReconciliation(currentX: number, currentY: number, serverX: number, serverY: number): boolean {
    const dx = currentX - serverX;
    const dy = currentY - serverY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance > this.reconciliationThreshold;
  }

  /**
   * 平滑调和 - 不是瞬间跳转，而是平滑过渡
   */
  smoothReconcile(
    currentX: number,
    currentY: number,
    targetX: number,
    targetY: number,
    lerpFactor: number = 0.3
  ): { x: number; y: number } {
    return {
      x: Phaser.Math.Linear(currentX, targetX, lerpFactor),
      y: Phaser.Math.Linear(currentY, targetY, lerpFactor),
    };
  }

  /**
   * 清空所有待处理的输入
   */
  clear() {
    this.pendingInputs = [];
    this.sequence = 0;
  }

  /**
   * 获取待处理输入数量（用于调试）
   */
  getPendingCount(): number {
    return this.pendingInputs.length;
  }
}
