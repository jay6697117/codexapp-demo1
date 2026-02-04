import Phaser from 'phaser';
import { GAME_CONFIG } from '@shared/constants';
import { Player } from '../entities/Player';
import { Item } from '../entities/Item';
import { RemotePlayer } from '../entities/RemotePlayer';
import { InputManager } from '../input/InputManager';
import { BulletManager } from '../managers/BulletManager';
import { ItemManager } from '../managers/ItemManager';
import { SafeZoneManager, ZoneState } from '../managers/SafeZoneManager';
import { AudioManager } from '../managers/AudioManager';
import { KillFeed } from '../ui/KillFeed';
import { GameOverScreen, PlayerResult } from '../ui/GameOverScreen';
import { Leaderboard, LeaderboardEntry } from '../ui/Leaderboard';
import { Minimap, MinimapPlayer, MinimapZone } from '../ui/Minimap';
import { HealthBar } from '../ui/HealthBar';
import { PickupNotification } from '../ui/PickupNotification';
import { AmmoBox } from '../ui/AmmoBox';
import { SkillBar } from '../ui/SkillBar';
import { TopInfoBar } from '../ui/TopInfoBar';
import { networkManager } from '../network';
import { generateTilemap } from '@pixel-arena/shared';
import { buildGameTextState } from '../utils/game-text-state';
import { ParticleManager } from '../effects/ParticleManager';

export class GameScene extends Phaser.Scene {
  public localPlayer!: Player;
  private inputManager!: InputManager;
  private bulletManager!: BulletManager;
  private itemManager!: ItemManager;
  private safeZoneManager!: SafeZoneManager;
  private audioManager!: AudioManager;
  private killFeed!: KillFeed;
  private gameOverScreen!: GameOverScreen;
  private leaderboard!: Leaderboard;
  private minimap!: Minimap;
  private pickupNotification!: PickupNotification;

  // 多人模式相关
  private remotePlayers: Map<string, RemotePlayer> = new Map();
  private isMultiplayer: boolean = false;
  private lastInputTime: number = 0;
  public particleManager!: ParticleManager;

  // HUD 元素
  private ammoBox!: AmmoBox;

  // 技能 HUD 元素
  private skillBar!: SkillBar;

  // HP HUD 元素
  private hpBar!: HealthBar;

  // 缩圈 HUD 元素
  private topInfoBar!: TopInfoBar;
  private zoneDamageTimer!: Phaser.Time.TimerEvent;
  private alivePlayers: number = 1;
  private totalPlayers: number = 1;

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
        this.pickupNotification.show(itemObj.subType.toUpperCase(), itemObj.itemType);
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

    // 初始化音效管理器
    this.audioManager = new AudioManager(this);

    // 初始化缩圈管理器
    this.safeZoneManager = new SafeZoneManager(this);
    this.safeZoneManager.start();

    // 创建缩圈 HUD
    this.createZoneHUD();

    // 初始化击杀信息显示
    this.killFeed = new KillFeed(this);

    // 初始化游戏结束界面
    this.gameOverScreen = new GameOverScreen(this);

    // 初始化排行榜
    this.leaderboard = new Leaderboard(this);

    // 初始化小地图
    this.minimap = new Minimap(this);

    // 初始化拾取提示
    this.pickupNotification = new PickupNotification(this);

    // 初始化特效管理器
    this.particleManager = new ParticleManager(this);

    // Day/Night Cycle Overlay (Pumpville Style Atmosphere)
    const overlay = this.add.rectangle(0, 0, GAME_CONFIG.MAP_WIDTH, GAME_CONFIG.MAP_HEIGHT, 0x1e1e2e, 0);
    overlay.setScrollFactor(0); // If we wanted HUD-like overlay, but we want world overlay.
    // Actually world overlay should cover the whole map.
    // Let's make it a UI overlay that "tints" the screen.
    overlay.width = this.cameras.main.width;
    overlay.height = this.cameras.main.height;
    overlay.setOrigin(0, 0);
    overlay.setDepth(100); // Below HUD but above game? HUD is distinct.
    // Let's put it at high depth but check HUD depth. HUDs usually just added.
    // Ideally we use a blend mode.

    this.tweens.add({
      targets: overlay,
      alpha: 0.3, // Night darkness
      duration: 30000, // 30s day/night cycle
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Resize overlay on resize event if we had one.

    this.registerTestHooks();

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
    this.isMultiplayer = (this.scene.settings.data as any)?.multiplayer || false;

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
      this.updateLeaderboard(state);
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

  private updateLeaderboard(state: any) {
    const myId = networkManager.getSessionId();
    const entries: LeaderboardEntry[] = [];
    let alivePlayers = 0;

    state.players.forEach((player: any, sessionId: string) => {
      if (player.isAlive) {
        alivePlayers++;
      }
      entries.push({
        id: sessionId,
        name: player.name,
        kills: player.kills || 0,
        isAlive: player.isAlive,
        isLocal: sessionId === myId,
      });
    });

    this.leaderboard.update(entries, alivePlayers, state.players.size);
    this.alivePlayers = alivePlayers;
    this.totalPlayers = state.players.size;
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

    // 更新小地图
    this.updateMinimap();

    // 多人模式：更新远程玩家并发送输入
    if (this.isMultiplayer) {
      // 更新远程玩家
      this.remotePlayers.forEach(player => player.update(delta));

      // 发送本地输入到服务器 (限制为 30Hz，但关键操作立即发送)
      const now = Date.now();
      const isCritical = input.shooting || input.skill;

      if (isCritical || now - this.lastInputTime >= 33) {
        this.lastInputTime = now;
        networkManager.sendInput({
          dx: input.dx,
          dy: input.dy,
          angle: input.angle,
          shooting: input.shooting,
          skill: input.skill,
        });
      }
    }
  }

  private createMap() {
    const tileSize = GAME_CONFIG.TILE_SIZE;
    const mapWidth = Math.floor(GAME_CONFIG.MAP_WIDTH / tileSize);
    const mapHeight = Math.floor(GAME_CONFIG.MAP_HEIGHT / tileSize);

    const data = generateTilemap(mapWidth, mapHeight);
    const map = this.make.tilemap({ data, tileWidth: tileSize, tileHeight: tileSize });
    const tileset = map.addTilesetImage('tileset_pixel', 'tileset_pixel', tileSize, tileSize, 0, 0);
    if (!tileset) return;

    map.createLayer(0, tileset, 0, 0);
  }

  private createAmmoHUD() {
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;

    const width = 180;
    const height = 70;
    this.ammoBox = new AmmoBox(this, screenWidth - width - 16, screenHeight - height - 16, width, height);
    this.ammoBox.setScrollFactor(0);
    this.ammoBox.setDepth(1000);
  }

  private updateAmmoHUD() {
    const weaponManager = this.localPlayer.getWeaponManager();
    const ammo = weaponManager.getAmmo();
    const maxAmmo = weaponManager.getMaxAmmo();

    this.ammoBox.updateAmmo(
      weaponManager.getWeaponName(),
      ammo,
      maxAmmo,
      weaponManager.isCurrentlyReloading(),
      weaponManager.getReloadProgress()
    );
  }

  private createSkillHUD() {
    const screenHeight = this.cameras.main.height;
    const width = 160;
    const height = 70;
    this.skillBar = new SkillBar(this, 16, screenHeight - height - 16, width, height);
    this.skillBar.setScrollFactor(0);
    this.skillBar.setDepth(1000);
  }

  private updateSkillHUD() {
    const skillManager = this.localPlayer.getSkillManager();
    const skillName = skillManager.getSkillName();
    const cooldownPercent = skillManager.getCooldownPercent();
    const remaining = skillManager.getCooldownRemaining();
    this.skillBar.updateSkill(skillName, cooldownPercent, skillManager.isSkillActive(), remaining);
  }

  private createHpHUD() {
    const maxHp = this.localPlayer.getMaxHp();
    this.hpBar = new HealthBar(this, 110, 24, 160, 16, maxHp, {
      showIcon: true,
      showText: true,
    });
    this.hpBar.setScrollFactor(0);
    this.hpBar.setDepth(1000);
  }

  private updateHpHUD() {
    const hp = this.localPlayer.getHp();
    const maxHp = this.localPlayer.getMaxHp();
    this.hpBar.setHp(hp, maxHp);
  }

  private createZoneHUD() {
    const screenWidth = this.cameras.main.width;
    const width = 300;
    const height = 36;
    this.topInfoBar = new TopInfoBar(this, screenWidth - width - 16, 16, width, height);
    this.topInfoBar.setScrollFactor(0);
    this.topInfoBar.setDepth(1000);
  }

  private updateZoneHUD(state: ZoneState) {
    this.topInfoBar.updateInfo(this.alivePlayers, this.totalPlayers, state.timeToNextPhase, state.isShrinking);
  }

  private registerTestHooks() {
    const win = window as unknown as {
      render_game_to_text?: () => string;
      advanceTime?: (ms: number) => void;
    };
    win.render_game_to_text = () => this.renderGameToText();
    win.advanceTime = (ms: number) => this.advanceTime(ms);
  }

  private renderGameToText(): string {
    const pos = this.localPlayer.getPosition();
    const weapon = this.localPlayer.getWeaponManager();
    const skill = this.localPlayer.getSkillManager();
    const zone = this.safeZoneManager.getState();

    return buildGameTextState({
      player: {
        x: pos.x,
        y: pos.y,
        hp: this.localPlayer.getHp(),
        maxHp: this.localPlayer.getMaxHp(),
      },
      weapon: {
        name: weapon.getWeaponName(),
        ammo: weapon.getAmmo(),
        maxAmmo: weapon.getMaxAmmo(),
      },
      skill: {
        name: skill.getSkillName(),
        cooldownPercent: skill.getCooldownPercent(),
        remainingMs: skill.getCooldownRemaining(),
        isActive: skill.isSkillActive(),
      },
      zone: {
        x: zone.x,
        y: zone.y,
        currentRadius: zone.currentRadius,
        targetRadius: zone.targetRadius,
        timeToNextPhase: zone.timeToNextPhase,
        isShrinking: zone.isShrinking,
      },
      alive: this.alivePlayers,
      total: this.totalPlayers,
    });
  }

  private advanceTime(ms: number) {
    if (!this.scene.isActive()) return;
    const step = 1000 / 60;
    const iterations = Math.max(1, Math.round(ms / step));
    for (let i = 0; i < iterations; i++) {
      this.physics.world.step(step / 1000);
      this.update(this.time.now, step);
    }
  }

  private applyZoneDamage() {
    if (!this.localPlayer.getIsAlive()) return;

    const pos = this.localPlayer.getPosition();
    if (!this.safeZoneManager.isInsideSafeZone(pos.x, pos.y)) {
      const damage = this.safeZoneManager.getDamage();
      if (damage > 0) {
        if (this.localPlayer.takeDamage(damage)) {
          // Player died
        } else {
           // Shake on damage
           this.cameras.main.shake(200, 0.005);
        }
      }
    }
  }

  private updateMinimap() {
    // Collect player data
    const players: MinimapPlayer[] = [];

    // Add local player
    const localPos = this.localPlayer.getPosition();
    players.push({
      id: 'local',
      x: localPos.x,
      y: localPos.y,
      isLocal: true,
      isAlive: this.localPlayer.getIsAlive(),
    });

    // Add remote players
    this.remotePlayers.forEach((remotePlayer, sessionId) => {
      players.push({
        id: sessionId,
        x: remotePlayer.x,
        y: remotePlayer.y,
        isLocal: false,
        isAlive: remotePlayer.isAlive,
      });
    });

    // Get safe zone data
    const zoneState = this.safeZoneManager.getState();
    const zone: MinimapZone = {
      x: zoneState.x,
      y: zoneState.y,
      currentRadius: zoneState.currentRadius,
      targetRadius: zoneState.targetRadius,
      isShrinking: zoneState.isShrinking,
    };

    this.minimap.update(players, zone);
  }
}
