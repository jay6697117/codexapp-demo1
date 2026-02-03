import Phaser from 'phaser';
import { GAME_CONFIG } from '@shared/constants';
import { Player } from '../entities/Player';
import { InputManager } from '../input/InputManager';

export class GameScene extends Phaser.Scene {
  public localPlayer!: Player;
  private inputManager!: InputManager;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // 设置世界边界
    this.physics.world.setBounds(0, 0, GAME_CONFIG.MAP_WIDTH, GAME_CONFIG.MAP_HEIGHT);

    // 创建地图
    this.createMap();

    // 设置相机边界
    this.cameras.main.setBounds(0, 0, GAME_CONFIG.MAP_WIDTH, GAME_CONFIG.MAP_HEIGHT);

    // 创建本地玩家
    this.localPlayer = new Player(
      this,
      GAME_CONFIG.MAP_WIDTH / 2,
      GAME_CONFIG.MAP_HEIGHT / 2,
      'local-player',
      'Player',
      'assault',
      true
    );

    // 设置相机跟随玩家
    this.cameras.main.startFollow(this.localPlayer, true, 0.1, 0.1);

    // 初始化输入管理器
    this.inputManager = new InputManager(this);

    // 添加调试文字
    const debugText = this.add.text(10, 10, 'WASD 移动 | 鼠标瞄准 | ESC 返回菜单', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 5, y: 5 },
    });
    debugText.setScrollFactor(0);
    debugText.setDepth(1000);

    // ESC 返回菜单
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  }

  update(time: number, delta: number) {
    // 更新玩家位置到输入管理器
    const pos = this.localPlayer.getPosition();
    this.inputManager.setPlayerPosition(pos.x, pos.y);

    // 获取输入并更新玩家
    const input = this.inputManager.getInput();
    this.localPlayer.update(input);
  }

  private createMap() {
    const tileSize = GAME_CONFIG.TILE_SIZE;
    const mapWidth = Math.floor(GAME_CONFIG.MAP_WIDTH / tileSize);
    const mapHeight = Math.floor(GAME_CONFIG.MAP_HEIGHT / tileSize);

    // 绘制地面层
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        this.add.image(
          x * tileSize + tileSize / 2,
          y * tileSize + tileSize / 2,
          'tile_ground'
        );
      }
    }

    // 绘制边界墙
    for (let x = 0; x < mapWidth; x++) {
      // 顶部墙
      this.add.image(x * tileSize + tileSize / 2, tileSize / 2, 'tile_wall');
      // 底部墙
      this.add.image(
        x * tileSize + tileSize / 2,
        (mapHeight - 1) * tileSize + tileSize / 2,
        'tile_wall'
      );
    }
    for (let y = 0; y < mapHeight; y++) {
      // 左侧墙
      this.add.image(tileSize / 2, y * tileSize + tileSize / 2, 'tile_wall');
      // 右侧墙
      this.add.image(
        (mapWidth - 1) * tileSize + tileSize / 2,
        y * tileSize + tileSize / 2,
        'tile_wall'
      );
    }

    // 添加随机障碍物（墙壁）
    const obstacleCount = 40;
    for (let i = 0; i < obstacleCount; i++) {
      const x = Phaser.Math.Between(3, mapWidth - 4);
      const y = Phaser.Math.Between(3, mapHeight - 4);
      // 随机生成 1-3 个连续墙壁
      const length = Phaser.Math.Between(1, 3);
      const horizontal = Math.random() > 0.5;

      for (let j = 0; j < length; j++) {
        const wx = horizontal ? x + j : x;
        const wy = horizontal ? y : y + j;
        if (wx < mapWidth - 1 && wy < mapHeight - 1) {
          this.add.image(
            wx * tileSize + tileSize / 2,
            wy * tileSize + tileSize / 2,
            'tile_wall'
          );
        }
      }
    }

    // 添加水域区域
    this.createWaterArea(5, 5, 6, 4);
    this.createWaterArea(35, 20, 5, 5);

    // 添加草丛区域
    this.createGrassArea(25, 8, 8, 5);
    this.createGrassArea(10, 25, 6, 4);

    // 添加岩浆区域
    this.createLavaArea(40, 30, 4, 3);
  }

  private createWaterArea(startX: number, startY: number, width: number, height: number) {
    const tileSize = GAME_CONFIG.TILE_SIZE;
    for (let dx = 0; dx < width; dx++) {
      for (let dy = 0; dy < height; dy++) {
        this.add.image(
          (startX + dx) * tileSize + tileSize / 2,
          (startY + dy) * tileSize + tileSize / 2,
          'tile_water'
        );
      }
    }
  }

  private createGrassArea(startX: number, startY: number, width: number, height: number) {
    const tileSize = GAME_CONFIG.TILE_SIZE;
    for (let dx = 0; dx < width; dx++) {
      for (let dy = 0; dy < height; dy++) {
        this.add.image(
          (startX + dx) * tileSize + tileSize / 2,
          (startY + dy) * tileSize + tileSize / 2,
          'tile_grass'
        );
      }
    }
  }

  private createLavaArea(startX: number, startY: number, width: number, height: number) {
    const tileSize = GAME_CONFIG.TILE_SIZE;
    for (let dx = 0; dx < width; dx++) {
      for (let dy = 0; dy < height; dy++) {
        this.add.image(
          (startX + dx) * tileSize + tileSize / 2,
          (startY + dy) * tileSize + tileSize / 2,
          'tile_lava'
        );
      }
    }
  }
}
