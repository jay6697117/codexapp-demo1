export interface Poolable {
  reset(): void;
  setActive(active: boolean): void;
  isActive(): boolean;
}

export class ObjectPool<T extends Poolable> {
  private pool: T[] = [];
  private activeObjects: Set<T> = new Set();
  private factory: () => T;
  private maxSize: number;

  constructor(factory: () => T, initialSize: number = 10, maxSize: number = 100) {
    this.factory = factory;
    this.maxSize = maxSize;

    // 预创建对象
    for (let i = 0; i < initialSize; i++) {
      const obj = this.factory();
      obj.setActive(false);
      this.pool.push(obj);
    }
  }

  /**
   * 从池中获取一个对象
   */
  acquire(): T | null {
    let obj: T | undefined;

    // 从池中取出一个不活跃的对象
    obj = this.pool.find(o => !o.isActive());

    if (!obj) {
      // 如果池已满，返回 null
      if (this.pool.length >= this.maxSize) {
        console.warn('ObjectPool: Max size reached, cannot acquire new object');
        return null;
      }

      // 创建新对象
      obj = this.factory();
      this.pool.push(obj);
    }

    obj.reset();
    obj.setActive(true);
    this.activeObjects.add(obj);

    return obj;
  }

  /**
   * 将对象归还到池中
   */
  release(obj: T): void {
    if (!this.activeObjects.has(obj)) {
      return;
    }

    obj.setActive(false);
    this.activeObjects.delete(obj);
  }

  /**
   * 释放所有活跃对象
   */
  releaseAll(): void {
    this.activeObjects.forEach(obj => {
      obj.setActive(false);
    });
    this.activeObjects.clear();
  }

  /**
   * 获取活跃对象数量
   */
  getActiveCount(): number {
    return this.activeObjects.size;
  }

  /**
   * 获取池中总对象数量
   */
  getTotalCount(): number {
    return this.pool.length;
  }

  /**
   * 遍历所有活跃对象
   */
  forEachActive(callback: (obj: T) => void): void {
    this.activeObjects.forEach(callback);
  }

  /**
   * 销毁池（清理资源）
   */
  destroy(): void {
    this.releaseAll();
    this.pool = [];
  }
}
