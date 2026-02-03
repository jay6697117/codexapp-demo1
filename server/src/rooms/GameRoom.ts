import { Room, Client } from 'colyseus';
import { GameRoomState, PlayerState, ItemState, SafeZoneState } from '../schemas/index.js';
import { GAME_CONFIG, CHARACTERS, WEAPONS, SAFE_ZONE } from '@pixel-arena/shared';

interface JoinOptions {
  name: string;
  character: string;
}

interface InputMessage {
  dx: number;
  dy: number;
  angle: number;
  shooting: boolean;
  skill: boolean;
  seq: number;
}

export class GameRoom extends Room<GameRoomState> {
  private gameLoop: ReturnType<typeof setInterval> | null = null;
  private gameStartTime: number = 0;
  private itemIdCounter: number = 0;
  private bulletIdCounter: number = 0;

  onCreate(options: any) {
    console.log('GameRoom created!', options);

    this.setState(new GameRoomState());
    this.maxClients = GAME_CONFIG.MAX_PLAYERS;

    // 设置房间元数据
    this.setMetadata({ name: 'Pixel Arena Game' });

    // 注册消息处理器
    this.onMessage('input', (client, message: InputMessage) => {
      this.handleInput(client, message);
    });

    this.onMessage('shoot', (client, message: { angle: number }) => {
      this.handleShoot(client, message.angle);
    });

    this.onMessage('skill', (client, message: { angle: number }) => {
      this.handleSkill(client, message.angle);
    });

    this.onMessage('reload', (client) => {
      this.handleReload(client);
    });

    // 初始化安全区
    this.initSafeZone();
  }

  onJoin(client: Client, options: JoinOptions) {
    console.log(`Player ${client.sessionId} joined with name: ${options.name}`);

    // 创建玩家状态
    const player = new PlayerState();
    player.id = client.sessionId;
    player.name = options.name || `Player_${client.sessionId.slice(0, 4)}`;
    player.character = options.character || 'assault';

    // 随机出生点
    const spawnPoint = this.getRandomSpawnPoint();
    player.x = spawnPoint.x;
    player.y = spawnPoint.y;

    // 设置角色属性
    const characterConfig = CHARACTERS[player.character as keyof typeof CHARACTERS];
    if (characterConfig) {
      player.maxHp = characterConfig.hp;
      player.hp = characterConfig.hp;
    }

    // 添加到房间状态
    this.state.players.set(client.sessionId, player);
    this.state.alivePlayers = this.getAlivePlayerCount();

    // 检查是否可以开始游戏
    this.checkGameStart();
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`Player ${client.sessionId} left`);

    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.isAlive = false;
      this.state.players.delete(client.sessionId);
      this.state.alivePlayers = this.getAlivePlayerCount();
    }

    // 检查游戏是否结束
    this.checkGameEnd();
  }

  onDispose() {
    console.log('GameRoom disposed');
    this.stopGameLoop();
  }

  private handleInput(client: Client, input: InputMessage) {
    const player = this.state.players.get(client.sessionId);
    if (!player || !player.isAlive) return;

    // 更新玩家位置
    const characterConfig = CHARACTERS[player.character as keyof typeof CHARACTERS];
    const speedModifier = characterConfig?.speedModifier || 1;
    const speed = GAME_CONFIG.PLAYER_SPEED * speedModifier;

    // 计算移动（服务器 tick 基于 50ms）
    const deltaTime = 1 / GAME_CONFIG.SERVER_TICK_RATE;
    player.x += input.dx * speed * deltaTime;
    player.y += input.dy * speed * deltaTime;

    // 限制在地图边界内
    player.x = Math.max(32, Math.min(GAME_CONFIG.MAP_WIDTH - 32, player.x));
    player.y = Math.max(32, Math.min(GAME_CONFIG.MAP_HEIGHT - 32, player.y));

    // 更新朝向
    player.angle = input.angle;
  }

  private handleShoot(client: Client, angle: number) {
    const player = this.state.players.get(client.sessionId);
    if (!player || !player.isAlive) return;
    if (player.ammo <= 0) return;

    // 减少弹药
    player.ammo--;

    // 创建子弹（简化版，实际游戏中需要更复杂的处理）
    // 子弹碰撞检测在游戏循环中处理
    this.broadcast('bullet', {
      ownerId: client.sessionId,
      x: player.x,
      y: player.y,
      angle: angle,
      weapon: player.weapon,
    });
  }

  private handleSkill(client: Client, angle: number) {
    const player = this.state.players.get(client.sessionId);
    if (!player || !player.isAlive) return;
    if (player.skillCooldown > 0) return;

    const characterConfig = CHARACTERS[player.character as keyof typeof CHARACTERS];
    if (!characterConfig) return;

    // 设置技能冷却
    player.skillCooldown = characterConfig.skillCooldown;

    // 广播技能使用
    this.broadcast('skill', {
      playerId: client.sessionId,
      skill: characterConfig.skill,
      angle: angle,
    });

    // 处理技能效果
    switch (characterConfig.skill) {
      case 'dash':
        // 冲刺
        player.x += Math.cos(angle) * 150;
        player.y += Math.sin(angle) * 150;
        player.isInvincible = true;
        this.clock.setTimeout(() => {
          player.isInvincible = false;
        }, 200);
        break;
      case 'shield':
        // 护盾
        player.isInvincible = true;
        this.clock.setTimeout(() => {
          player.isInvincible = false;
        }, 3000);
        break;
      case 'backflip':
        // 后空翻
        player.x -= Math.cos(angle) * 80;
        player.y -= Math.sin(angle) * 80;
        player.isInvincible = true;
        this.clock.setTimeout(() => {
          player.isInvincible = false;
        }, 300);
        break;
      case 'healAura':
        // 治疗光环
        let healCount = 0;
        const healInterval = this.clock.setInterval(() => {
          if (player.isAlive && healCount < 5) {
            player.hp = Math.min(player.maxHp, player.hp + 10);
            healCount++;
          }
        }, 1000);
        this.clock.setTimeout(() => {
          healInterval.clear();
        }, 5000);
        break;
    }
  }

  private handleReload(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (!player || !player.isAlive) return;

    const weaponConfig = WEAPONS[player.weapon as keyof typeof WEAPONS];
    if (!weaponConfig) return;

    // 设置满弹药（简化版，实际应该有换弹时间）
    player.ammo = weaponConfig.magazineSize;
  }

  private getRandomSpawnPoint(): { x: number; y: number } {
    const margin = 100;
    return {
      x: margin + Math.random() * (GAME_CONFIG.MAP_WIDTH - margin * 2),
      y: margin + Math.random() * (GAME_CONFIG.MAP_HEIGHT - margin * 2),
    };
  }

  private getAlivePlayerCount(): number {
    let count = 0;
    this.state.players.forEach((player) => {
      if (player.isAlive) count++;
    });
    return count;
  }

  private checkGameStart() {
    if (this.state.phase !== 'waiting') return;

    // 至少 2 人开始（测试用，正式应该是 MIN_PLAYERS）
    if (this.state.players.size >= 2) {
      this.startCountdown();
    }
  }

  private startCountdown() {
    this.state.phase = 'starting';
    this.state.countdown = 3;

    const countdownInterval = this.clock.setInterval(() => {
      this.state.countdown--;
      if (this.state.countdown <= 0) {
        countdownInterval.clear();
        this.startGame();
      }
    }, 1000);
  }

  private startGame() {
    console.log('Game started!');
    this.state.phase = 'playing';
    this.state.countdown = 0;
    this.gameStartTime = Date.now();

    // 生成初始道具
    this.spawnInitialItems();

    // 启动游戏循环
    this.startGameLoop();
  }

  private startGameLoop() {
    const tickRate = 1000 / GAME_CONFIG.SERVER_TICK_RATE;

    this.gameLoop = setInterval(() => {
      this.gameTick();
    }, tickRate);
  }

  private stopGameLoop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
  }

  private gameTick() {
    if (this.state.phase !== 'playing') return;

    const now = Date.now();
    this.state.elapsedTime = now - this.gameStartTime;

    // 更新安全区
    this.updateSafeZone();

    // 更新技能冷却
    this.updateCooldowns();

    // 检查毒圈伤害
    this.applyZoneDamage();

    // 检查游戏结束
    this.checkGameEnd();
  }

  private initSafeZone() {
    const zone = this.state.safeZone;
    zone.x = GAME_CONFIG.MAP_WIDTH / 2;
    zone.y = GAME_CONFIG.MAP_HEIGHT / 2;
    zone.currentRadius = Math.sqrt(
      Math.pow(GAME_CONFIG.MAP_WIDTH / 2, 2) +
      Math.pow(GAME_CONFIG.MAP_HEIGHT / 2, 2)
    );
    zone.targetRadius = zone.currentRadius;
    zone.phase = 0;
    zone.damage = 0;
    zone.isShrinking = false;
  }

  private updateSafeZone() {
    const zone = this.state.safeZone;
    const elapsed = this.state.elapsedTime;

    // 检查阶段变化
    for (let i = SAFE_ZONE.phases.length - 1; i >= 0; i--) {
      const phaseConfig = SAFE_ZONE.phases[i];
      if (elapsed >= phaseConfig.time && zone.phase < i) {
        zone.phase = i;
        zone.damage = phaseConfig.damage;
        zone.isShrinking = true;

        const maxRadius = Math.sqrt(
          Math.pow(GAME_CONFIG.MAP_WIDTH / 2, 2) +
          Math.pow(GAME_CONFIG.MAP_HEIGHT / 2, 2)
        );
        zone.targetRadius = maxRadius * phaseConfig.radiusPercent;
        break;
      }
    }

    // 缩圈动画
    if (zone.isShrinking && zone.currentRadius > zone.targetRadius) {
      const shrinkSpeed = (zone.currentRadius - zone.targetRadius) / (SAFE_ZONE.shrinkDuration / 50);
      zone.currentRadius = Math.max(zone.targetRadius, zone.currentRadius - shrinkSpeed);

      if (zone.currentRadius <= zone.targetRadius) {
        zone.isShrinking = false;
      }
    }
  }

  private updateCooldowns() {
    const tickTime = 1000 / GAME_CONFIG.SERVER_TICK_RATE;

    this.state.players.forEach((player) => {
      if (player.skillCooldown > 0) {
        player.skillCooldown = Math.max(0, player.skillCooldown - tickTime);
      }
    });
  }

  private applyZoneDamage() {
    const zone = this.state.safeZone;
    if (zone.damage <= 0) return;

    this.state.players.forEach((player) => {
      if (!player.isAlive) return;

      const distance = Math.sqrt(
        Math.pow(player.x - zone.x, 2) +
        Math.pow(player.y - zone.y, 2)
      );

      if (distance > zone.currentRadius) {
        // 在毒圈外，造成伤害（每秒伤害，按 tick 分配）
        const damagePerTick = zone.damage / GAME_CONFIG.SERVER_TICK_RATE;
        player.hp = Math.max(0, player.hp - damagePerTick);

        if (player.hp <= 0) {
          this.killPlayer(player.id, 'zone');
        }
      }
    });
  }

  private killPlayer(playerId: string, killerId: string) {
    const victim = this.state.players.get(playerId);
    if (!victim || !victim.isAlive) return;

    victim.isAlive = false;
    this.state.alivePlayers = this.getAlivePlayerCount();

    // 如果是玩家击杀，增加击杀数
    if (killerId !== 'zone') {
      const killer = this.state.players.get(killerId);
      if (killer) {
        killer.kills++;
      }
    }

    // 广播击杀消息
    this.broadcast('kill', {
      killerId,
      victimId: playerId,
      victimName: victim.name,
    });
  }

  private checkGameEnd() {
    if (this.state.phase !== 'playing') return;

    if (this.state.alivePlayers <= 1) {
      this.endGame();
    }
  }

  private endGame() {
    this.state.phase = 'ended';
    this.stopGameLoop();

    // 计算排名
    const rankings: Array<{ id: string; name: string; kills: number; rank: number }> = [];
    this.state.players.forEach((player) => {
      rankings.push({
        id: player.id,
        name: player.name,
        kills: player.kills,
        rank: player.isAlive ? 1 : rankings.length + 2,
      });
    });

    // 按击杀数排序
    rankings.sort((a, b) => b.kills - a.kills);

    this.broadcast('gameEnd', { rankings });

    console.log('Game ended!', rankings);
  }

  private spawnInitialItems() {
    const itemCount = 10;
    const weapons = ['smg', 'rifle', 'shotgun'];
    const skills = ['dash', 'shield', 'backflip', 'healAura'];

    for (let i = 0; i < itemCount; i++) {
      const item = new ItemState();
      item.id = `item_${++this.itemIdCounter}`;
      item.itemType = Math.random() < 0.7 ? 'weapon' : 'skill';
      item.subType = item.itemType === 'weapon'
        ? weapons[Math.floor(Math.random() * weapons.length)]
        : skills[Math.floor(Math.random() * skills.length)];
      item.x = 100 + Math.random() * (GAME_CONFIG.MAP_WIDTH - 200);
      item.y = 100 + Math.random() * (GAME_CONFIG.MAP_HEIGHT - 200);
      item.isActive = true;

      this.state.items.set(item.id, item);
    }
  }
}
