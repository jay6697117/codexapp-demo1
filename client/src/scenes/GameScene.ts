import Phaser from 'phaser';
import { GAME_CONFIG } from '@shared/constants';
import { Player } from '../entities/Player';
import { Item } from '../entities/Item';
import { RemotePlayer } from '../entities/RemotePlayer';
import { InputManager } from '../input/InputManager';
import { BulletManager } from '../managers/BulletManager';
import { ItemManager } from '../managers/ItemManager';
import { SafeZoneManager, ZoneState } from '../managers/SafeZoneManager';
import { KillFeed } from '../ui/KillFeed';
import { GameOverScreen, PlayerResult } from '../ui/GameOverScreen';
import { networkManager } from '../network';

export class GameScene extends Phaser.Scene {
  public localPlayer!: Player;
  private inputManager!: InputManager;
  private bulletManager!: BulletManager;
  private itemManager!: ItemManager;
  private safeZoneManager!: SafeZoneManager;
  private killFeed!: KillFeed;
  private gameOverScreen!: GameOverScreen;

  // 多人模式相关
  private remotePlayers: Map<string, RemotePlayer> = new Map();
  private isMultiplayer: boolean = false;

  // HUD 元素
  private weaponText!: Phaser.GameObjects.Text;
  private ammoText!: Phaser.GameObjects.Text;
  private reloadText!: Phaser.GameObjects.Text;

  // 技能 HUD 元素
  private skillNameText!: Phaser.GameObjects.Text;
  private skillCooldownBar!: Phaser.GameObjects.Graphics;
  private skillReadyText!: Phaser.GameObjects.Text;

  // HP HUD 元素
  private hpText!: Phaser.GameObjects.Text;

  // 缩圈 HUD 元素
  private zoneHudText!: Phaser.GameObjects.Text;
  private zoneDamageTimer!: Phaser.Time.TimerEvent;

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

    // 初始化子弹管理器
    this.bulletManager = new BulletManager(this);
    this.localPlayer.setBulletManager(this.bulletManager);

    // 初始化道具管理器
    this.itemManager = new ItemManager(this);
    this.itemManager.startSpawning(5000, 10);

    // 添加玩家与道具的碰撞检测
    this.physics.add.overlap(
      this.localPlayer,
      this.itemManager.getItemGroup(),
      (player, item) => {
        const itemObj = item as Item;
        this.localPlayer.pickupItem(itemObj);
        this.itemManager.removeItem(itemObj.itemId);
      }
    );

    // 添加调试文字
    const debugText = this.add.text(10, 10, 'WASD 移动 | 鼠标瞄准 | 左键/空格 射击 | R 换弹 | Q 技能 | ESC 返回菜单', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 5, y: 5 },
    });
    debugText.setScrollFactor(0);
    debugText.setDepth(1000);

    // 创建弹药 HUD
    this.createAmmoHUD();

    // 创建技能 HUD
    this.createSkillHUD();

    // 创建 HP HUD
    this.createHpHUD();

    // 初始化缩圈管理器
    this.safeZoneManager = new SafeZoneManager(this);
    this.safeZoneManager.start();

    // 创建缩圈 HUD
    this.createZoneHUD();

    // 初始化击杀信息显示
    this.killFeed = new KillFeed(this);

    // 初始化游戏结束界面
    this.gameOverScreen = new GameOverScreen(this);

    // 每秒检查毒圈伤害
    this.zoneDamageTimer = this.time.addEvent({
      delay: 1000,
      callback: this.applyZoneDamage,
      callbackScope: this,
      loop: true,
    });

    // ESC 返回菜单
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.isMultiplayer) {
        networkManager.leave();
      }
      this.scene.start('MenuScene');
    });

    // 检查是否多人模式（通过 scene data 传递）
    this.isMultiplayer = this.scene.settings.data?.multiplayer || false;

    if (this.isMultiplayer) {
      this.setupNetworkListeners();
    }
  }

  private setupNetworkListeners() {
    const room = networkManager.getRoom();
    if (!room) return;

    // 监听玩家加入
    networkManager.on('playerJoin', ({ sessionId, player }: { sessionId: string; player: any }) => {
      if (sessionId === networkManager.getSessionId()) return;
      this.addRemotePlayer(sessionId, player);
    });

    // 监听玩家离开
    networkManager.on('playerLeave', ({ sessionId }: { sessionId: string }) => {
      this.removeRemotePlayer(sessionId);
    });

    // 监听状态变化
    networkManager.on('stateChange', (state: any) => {
      this.syncPlayersFromState(state);
    });

    // 监听子弹
    networkManager.on('bullet', (data: any) => {
      if (data.ownerId === networkManager.getSessionId()) return;
      this.bulletManager.spawnBullet(data.x, data.y, data.angle, data.weapon);
    });

    // 监听技能
    networkManager.on('skill', (data: any) => {
      if (data.playerId === networkManager.getSessionId()) return;
      // 播放远程玩家技能效果（可扩展）
      console.log('Remote player used skill:', data);
    });

    // 监听击杀事件
    networkManager.on('kill', (data: { killerId: string; victimId: string; victimName: string }) => {
      const myId = networkManager.getSessionId();

      if (data.killerId === 'zone') {
        // 毒圈击杀
        this.killFeed.addZoneKill(data.victimName, data.victimId === myId);
      } else {
        // 玩家击杀
        const room = networkManager.getRoom();
        const killer = room?.state.players.get(data.killerId);
        const killerName = killer?.name || 'Unknown';
        this.killFeed.addKill(killerName, data.victimName, data.killerId === myId, data.victimId === myId);
      }

      // 如果本地玩家被击杀
      if (data.victimId === myId) {
        this.localPlayer.die();
      }
    });

    // 监听游戏结束
    networkManager.on('gameEnd', (data: { rankings: any[] }) => {
      const { rankings } = data;
      const myId = networkManager.getSessionId();

      const results: PlayerResult[] = rankings.map((r: any) => ({
        id: r.id,
        name: r.name,
        rank: r.rank,
        kills: r.kills,
        damage: r.damage || 0,
        isLocal: r.id === myId,
      }));

      const localResult = results.find(r => r.isLocal);
      const localRank = localResult?.rank || results.length;

      this.gameOverScreen.show(localRank, results.length, results);
    });

    // 初始化已存在的玩家
    room.state.players.forEach((player: any, sessionId: string) => {
      if (sessionId !== networkManager.getSessionId()) {
        this.addRemotePlayer(sessionId, player);
      }
    });
  }

  private addRemotePlayer(sessionId: string, state: any) {
    if (this.remotePlayers.has(sessionId)) return;

    const remotePlayer = new RemotePlayer(this, sessionId, state);
    this.remotePlayers.set(sessionId, remotePlayer);
    console.log('Added remote player:', sessionId, state.name);
  }

  private removeRemotePlayer(sessionId: string) {
    const remotePlayer = this.remotePlayers.get(sessionId);
    if (remotePlayer) {
      remotePlayer.destroy();
      this.remotePlayers.delete(sessionId);
      console.log('Removed remote player:', sessionId);
    }
  }

  private syncPlayersFromState(state: any) {
    state.players.forEach((playerState: any, sessionId: string) => {
      if (sessionId === networkManager.getSessionId()) {
        // 可选：同步本地玩家状态（服务器权威）
        // this.localPlayer.syncFromServer(playerState);
        return;
      }

      const remotePlayer = this.remotePlayers.get(sessionId);
      if (remotePlayer) {
        remotePlayer.updateFromState(playerState);
      } else {
        // 如果远程玩家不存在，添加它
        this.addRemotePlayer(sessionId, playerState);
      }
    });
  }

  update(time: number, delta: number) {
    // 更新玩家位置到输入管理器
    const pos = this.localPlayer.getPosition();
    this.inputManager.setPlayerPosition(pos.x, pos.y);

    // 获取输入并更新玩家
    const input = this.inputManager.getInput();
    const reloading = this.inputManager.isReloading();
    this.localPlayer.update(input, reloading);

    // 更新弹药 HUD
    this.updateAmmoHUD();

    // 更新技能 HUD
    this.updateSkillHUD();

    // 更新 HP HUD
    this.updateHpHUD();

    // 更新缩圈系统
    const zoneState = this.safeZoneManager.update();
    this.updateZoneHUD(zoneState);

    // 多人模式：更新远程玩家并发送输入
    if (this.isMultiplayer) {
      // 更新远程玩家
      this.remotePlayers.forEach(player => player.update(delta));

      // 发送本地输入到服务器
      networkManager.sendInput({
        dx: input.dx,
        dy: input.dy,
        angle: input.angle,
        shooting: input.shooting,
        skill: input.skill,
      });
    }
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

  private createAmmoHUD() {
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;

    // 武器名称
    this.weaponText = this.add.text(screenWidth - 150, screenHeight - 80, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.weaponText.setScrollFactor(0);
    this.weaponText.setDepth(1000);

    // 弹药数量
    this.ammoText = this.add.text(screenWidth - 150, screenHeight - 55, '', {
      fontSize: '24px',
      color: '#ffff00',
      fontStyle: 'bold',
    });
    this.ammoText.setScrollFactor(0);
    this.ammoText.setDepth(1000);

    // 换弹提示
    this.reloadText = this.add.text(screenWidth - 150, screenHeight - 25, '', {
      fontSize: '14px',
      color: '#ff6600',
    });
    this.reloadText.setScrollFactor(0);
    this.reloadText.setDepth(1000);
  }

  private updateAmmoHUD() {
    const weaponManager = this.localPlayer.getWeaponManager();

    // 更新武器名称
    this.weaponText.setText(weaponManager.getWeaponName());

    // 更新弹药数量
    const ammo = weaponManager.getAmmo();
    const maxAmmo = weaponManager.getMaxAmmo();
    this.ammoText.setText(`${ammo} / ${maxAmmo}`);

    // 弹药颜色：低弹药时变红
    if (ammo <= Math.ceil(maxAmmo * 0.25)) {
      this.ammoText.setColor('#ff0000');
    } else if (ammo <= Math.ceil(maxAmmo * 0.5)) {
      this.ammoText.setColor('#ffaa00');
    } else {
      this.ammoText.setColor('#ffff00');
    }

    // 更新换弹提示
    if (weaponManager.isCurrentlyReloading()) {
      const progress = Math.floor(weaponManager.getReloadProgress() * 100);
      this.reloadText.setText(`换弹中... ${progress}%`);
      this.reloadText.setVisible(true);
    } else if (ammo === 0) {
      this.reloadText.setText('按 R 换弹');
      this.reloadText.setVisible(true);
    } else {
      this.reloadText.setVisible(false);
    }
  }

  private createSkillHUD() {
    const screenHeight = this.cameras.main.height;

    // 技能名称
    this.skillNameText = this.add.text(20, screenHeight - 80, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.skillNameText.setScrollFactor(0);
    this.skillNameText.setDepth(1000);

    // 技能冷却进度条背景和前景
    this.skillCooldownBar = this.add.graphics();
    this.skillCooldownBar.setScrollFactor(0);
    this.skillCooldownBar.setDepth(1000);

    // 技能就绪提示
    this.skillReadyText = this.add.text(20, screenHeight - 25, '', {
      fontSize: '14px',
      color: '#00ff00',
    });
    this.skillReadyText.setScrollFactor(0);
    this.skillReadyText.setDepth(1000);
  }

  private updateSkillHUD() {
    const skillManager = this.localPlayer.getSkillManager();
    const screenHeight = this.cameras.main.height;

    // 更新技能名称
    const skillName = skillManager.getSkillName();
    this.skillNameText.setText(`[Q] ${skillName}`);

    // 更新冷却进度条
    const cooldownPercent = skillManager.getCooldownPercent();
    const barWidth = 100;
    const barHeight = 12;
    const barX = 20;
    const barY = screenHeight - 55;

    this.skillCooldownBar.clear();

    // 背景条（灰色）
    this.skillCooldownBar.fillStyle(0x333333, 1);
    this.skillCooldownBar.fillRect(barX, barY, barWidth, barHeight);

    // 进度条（根据状态变色）
    if (cooldownPercent >= 1) {
      // 就绪状态：绿色
      this.skillCooldownBar.fillStyle(0x00ff00, 1);
    } else if (skillManager.isSkillActive()) {
      // 激活中：蓝色
      this.skillCooldownBar.fillStyle(0x0088ff, 1);
    } else {
      // 冷却中：橙色
      this.skillCooldownBar.fillStyle(0xff6600, 1);
    }
    this.skillCooldownBar.fillRect(barX, barY, barWidth * cooldownPercent, barHeight);

    // 边框
    this.skillCooldownBar.lineStyle(2, 0xffffff, 0.8);
    this.skillCooldownBar.strokeRect(barX, barY, barWidth, barHeight);

    // 更新就绪提示
    if (skillManager.canUseSkill()) {
      this.skillReadyText.setText('就绪');
      this.skillReadyText.setColor('#00ff00');
    } else if (skillManager.isSkillActive()) {
      this.skillReadyText.setText('激活中');
      this.skillReadyText.setColor('#0088ff');
    } else {
      const remaining = Math.ceil(skillManager.getCooldownRemaining() / 1000);
      this.skillReadyText.setText(`冷却中 ${remaining}s`);
      this.skillReadyText.setColor('#ff6600');
    }
  }

  private createHpHUD() {
    this.hpText = this.add.text(10, 50, '', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 },
    });
    this.hpText.setScrollFactor(0);
    this.hpText.setDepth(1000);
  }

  private updateHpHUD() {
    const hp = this.localPlayer.getHp();
    const maxHp = this.localPlayer.getMaxHp();
    this.hpText.setText(`HP: ${hp}/${maxHp}`);

    // 根据血量百分比变色
    const percent = hp / maxHp;
    if (percent > 0.6) {
      this.hpText.setColor('#00ff00');
    } else if (percent > 0.3) {
      this.hpText.setColor('#ffff00');
    } else {
      this.hpText.setColor('#ff0000');
    }
  }

  private createZoneHUD() {
    const screenWidth = this.cameras.main.width;

    this.zoneHudText = this.add.text(screenWidth - 10, 10, '', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 },
    });
    this.zoneHudText.setOrigin(1, 0);
    this.zoneHudText.setScrollFactor(0);
    this.zoneHudText.setDepth(1000);
  }

  private updateZoneHUD(state: ZoneState) {
    const phaseText = `阶段 ${state.phase + 1}/5`;
    const damageText = state.damage > 0 ? `伤害: ${state.damage}/秒` : '安全';
    const timeText = state.timeToNextPhase > 0
      ? `下次缩圈: ${Math.ceil(state.timeToNextPhase / 1000)}秒`
      : '最终阶段';
    const shrinkText = state.isShrinking ? ' [缩圈中]' : '';

    this.zoneHudText.setText(`${phaseText}\n${damageText}\n${timeText}${shrinkText}`);

    // 根据状态变色
    if (state.isShrinking) {
      this.zoneHudText.setColor('#ff6600');
    } else if (state.damage > 0) {
      this.zoneHudText.setColor('#ffaa00');
    } else {
      this.zoneHudText.setColor('#ffffff');
    }
  }

  private applyZoneDamage() {
    if (!this.localPlayer.getIsAlive()) return;

    const pos = this.localPlayer.getPosition();
    if (!this.safeZoneManager.isInsideSafeZone(pos.x, pos.y)) {
      const damage = this.safeZoneManager.getDamage();
      if (damage > 0) {
        this.localPlayer.takeDamage(damage);
      }
    }
  }
}
