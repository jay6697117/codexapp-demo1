export class BulletCollisionTracker {
  private hits = 0;
  private active = 0;

  recordHit(): void {
    this.hits += 1;
  }

  setActive(active: number): void {
    this.active = active;
  }

  reset(): void {
    this.hits = 0;
    this.active = 0;
  }

  getStats(): { hits: number; active: number } {
    return { hits: this.hits, active: this.active };
  }
}
