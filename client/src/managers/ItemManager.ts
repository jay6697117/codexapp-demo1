import Phaser from 'phaser';
import { Item, ItemConfig, ItemType } from '../entities/Item';
import { GAME_CONFIG } from '@shared/constants';

export class ItemManager {
  private scene: Phaser.Scene;
  private items: Map<string, Item> = new Map();
  private itemGroup: Phaser.GameObjects.Group;
  private spawnTimer: Phaser.Time.TimerEvent | null = null;
  private itemIdCounter: number = 0;

  // 道具刷新点（避开边界和固定障碍物）
  private spawnPoints: Array<{ x: number; y: number }> = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.itemGroup = scene.add.group();
    this.generateSpawnPoints();
  }

  private generateSpawnPoints() {
    const tileSize = GAME_CONFIG.TILE_SIZE;
    const mapWidth = Math.floor(GAME_CONFIG.MAP_WIDTH / tileSize);
    const mapHeight = Math.floor(GAME_CONFIG.MAP_HEIGHT / tileSize);

    // 在地图内部生成刷新点（避开边界 3 格）
    for (let x = 3; x < mapWidth - 3; x += 4) {
      for (let y = 3; y < mapHeight - 3; y += 4) {
        this.spawnPoints.push({
          x: x * tileSize + tileSize / 2,
          y: y * tileSize + tileSize / 2,
        });
      }
    }
  }

  startSpawning(interval: number = 5000, maxItems: number = 10) {
    // 初始生成一些道具
    this.spawnInitialItems(5);

    // 定时刷新道具
    this.spawnTimer = this.scene.time.addEvent({
      delay: interval,
      callback: () => {
        if (this.items.size < maxItems) {
          this.spawnRandomItem();
        }
      },
      loop: true,
    });
  }

  private spawnInitialItems(count: number) {
    for (let i = 0; i < count; i++) {
      this.spawnRandomItem();
    }
  }

  private spawnRandomItem() {
    // 随机选择刷新点
    const point = Phaser.Utils.Array.GetRandom(this.spawnPoints);
    if (!point) return;

    // 随机道具类型（70% 武器，30% 技能）
    const isWeapon = Math.random() < 0.7;
    const type: ItemType = isWeapon ? 'weapon' : 'skill';

    let subType: string;
    if (isWeapon) {
      const weapons = ['smg', 'rifle', 'shotgun'];
      subType = Phaser.Utils.Array.GetRandom(weapons);
    } else {
      const skills = ['dash', 'shield', 'backflip', 'healAura'];
      subType = Phaser.Utils.Array.GetRandom(skills);
    }

    this.spawnItem({
      id: `item_${++this.itemIdCounter}`,
      type,
      subType,
      x: point.x,
      y: point.y,
    });
  }

  spawnItem(config: ItemConfig): Item {
    const item = new Item(this.scene, config);
    this.items.set(config.id, item);
    this.itemGroup.add(item);
    return item;
  }

  removeItem(itemId: string) {
    const item = this.items.get(itemId);
    if (item) {
      item.destroy();
      this.items.delete(itemId);
    }
  }

  getItemGroup(): Phaser.GameObjects.Group {
    return this.itemGroup;
  }

  getItems(): Map<string, Item> {
    return this.items;
  }

  stopSpawning() {
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
      this.spawnTimer = null;
    }
  }

  clear() {
    this.stopSpawning();
    this.items.forEach((item) => item.destroy());
    this.items.clear();
  }
}
