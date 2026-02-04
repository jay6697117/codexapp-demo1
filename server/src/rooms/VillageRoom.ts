import { Room, Client } from '@colyseus/core';
import { VillageState } from '../schemas/VillageState';
import { PlayerState } from '../schemas/PlayerState';
import { ItemState } from '../schemas/ItemState';

interface JoinOptions {
  name: string;
  character: string;
}

interface InputMessage {
  dx: number;
  dy: number;
  angle: number;
}

export class VillageRoom extends Room<VillageState> {
  onCreate(options: any) {
    console.log('VillageRoom created!', options);
    this.setState(new VillageState());
    this.maxClients = 50; // 村庄容纳更多人
    this.setMetadata({ name: 'Pumpville Village' });

    // 处理移动输入
    this.onMessage('input', (client, message: InputMessage) => {
      this.handleInput(client, message);
    });

    // 处理聊天 (简单广播)
    this.onMessage('chat', (client, message: { text: string }) => {
        const player = this.state.players.get(client.sessionId);
        if (player) {
            this.broadcast('chat', {
                playerId: client.sessionId,
                text: message.text,
                timestamp: Date.now()
            });
        }
    });

    // 初始生成代币
    this.spawnTokens(30);
  }

  onJoin(client: Client, options: JoinOptions) {
    console.log(`Villager ${client.sessionId} joined: ${options.name}`);

    // 复用 PlayerState，但不需要血量武器等逻辑
    const player = new PlayerState();
    player.id = client.sessionId;
    player.name = options.name || `Villager_${client.sessionId.slice(0, 4)}`;
    player.character = options.character || 'original'; // 默认角色
    player.coins = 0; // 初始金币

    // 随机出生在村庄中心附近
    player.x = 400 + (Math.random() * 100 - 50);
    player.y = 300 + (Math.random() * 100 - 50);
    player.isAlive = true;

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client) {
    console.log(`Villager ${client.sessionId} left`);
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log('VillageRoom disposed');
  }

  private handleInput(client: Client, input: InputMessage) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    // 简单的移动逻辑 (服务器权威位置更新)
    const moveSpeed = 3;
    if (input.dx) player.x += input.dx * moveSpeed;
    if (input.dy) player.y += input.dy * moveSpeed;
    player.angle = input.angle;

    // 边界限制
    player.x = Math.max(0, Math.min(800, player.x));
    player.y = Math.max(0, Math.min(600, player.y));

    // 拾取检测
    this.checkPickup(client, player);
  }

  private checkPickup(client: Client, player: PlayerState) {
      this.state.items.forEach((item, itemId) => {
          // 简单的距离检测 (30px 半径)
          const dist = Math.sqrt((player.x - item.x) ** 2 + (player.y - item.y) ** 2);

          if (dist < 30) {
              // 增加金币
              player.coins = (player.coins || 0) + 10;

              // 移除物品
              this.state.items.delete(itemId);

              // 广播拾取特效 (客户端处理视觉)
              this.broadcast('pickup', {
                  playerId: client.sessionId,
                  itemId: itemId,
                  coins: 10,
                  x: item.x,
                  y: item.y
              });

              // 3秒后重生一个新的
              this.clock.setTimeout(() => {
                  this.spawnToken();
              }, 3000);
          }
      });
  }

  private spawnTokens(count: number) {
      for (let i = 0; i < count; i++) {
          this.spawnToken();
      }
  }

  private spawnToken() {
      const item = new ItemState();
      item.id = Math.random().toString(36).substr(2, 9);
      item.itemType = 'token';
      // 随机分布在地图上 (留出边缘 buffer)
      item.x = 50 + Math.random() * 700;
      item.y = 50 + Math.random() * 500;
      item.isActive = true;

      this.state.items.set(item.id, item);
  }
}
