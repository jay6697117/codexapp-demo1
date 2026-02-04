import Phaser from 'phaser';
import { Room } from 'colyseus.js';
import { NetworkManager } from '../network/NetworkManager';
import { VillageState } from '@pixel-arena/server/src/schemas/VillageState';
import { PlayerState } from '@pixel-arena/server/src/schemas/PlayerState';
import { ItemState } from '@pixel-arena/server/src/schemas/ItemState';
import { ChatUI } from '../ui/ChatUI';
import { TextureGenerator } from '../utils/TextureGenerator';

export class VillageScene extends Phaser.Scene {
  private room?: Room<VillageState>;
  private playerEntities: { [id: string]: Phaser.GameObjects.Sprite } = {};
  private itemEntities: { [id: string]: Phaser.GameObjects.Sprite } = {}; // 物品实体
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private coinText!: Phaser.GameObjects.Text;
  private currentPlayerId?: string;
  private mapWidth = 800; // 暂时写死，后续应该是 Village 地图大小
  private mapHeight = 600;

  constructor() {
    super('VillageScene');
  }

  async create(data: { name: string; character: string }) {
    console.log('Entering VillageScene', data);

    // 生成角色纹理
    TextureGenerator.createTextures(this);
    TextureGenerator.createMapTextures(this);

    // 背景 - 使用地砖纹理
    this.add.tileSprite(400, 300, this.mapWidth, this.mapHeight, 'tile_floor');

    // 简单 UI
    this.add.text(10, 10, 'Village Square (Social Zone)', {
      fontFamily: '"Press Start 2P"', // 如果没有载入，回退到 monospace
      fontSize: '20px',
      color: '#00ff41' // Neon Green
    });

    this.add.text(10, 40, 'Press ARROW keys to move', { fontSize: '14px', color: '#aaaaaa' });

    // 传送门
    const portal = this.add.circle(750, 300, 30, 0x9900ff);
    this.add.text(720, 340, 'TO ARENA', { fontSize: '12px', color: '#9900ff' });

    // 初始化网络
    const networkManager = NetworkManager.getInstance();

    try {
      // 使用 networkManager 加入 village
      // 注意: 这里我们 cast options 因为 NetworkManager 的 JoinOptions 可能和我们传的不完全一样，
      // 但其实是一样的 { name, character }
      await networkManager.joinOrCreate({
        name: data.name,
        character: data.character,
      }, 'village');

      this.room = networkManager.getRoom() as Room<VillageState>;

      console.log('Joined village room successfully!');
      this.currentPlayerId = this.room.sessionId;
      this.setupRoomHandlers();

    } catch (e) {
      console.error('Failed to join village:', e);
      // 回到菜单
      this.time.delayedCall(1000, () => {
          this.scene.start('MenuScene');
      });
    }

    // 聊天 UI
    new ChatUI(this);

    // 金币显示 UI (Fixed to camera)
    this.coinText = this.add.text(10, 80, '$PIXEL: 0', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '16px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 4
    }).setScrollFactor(0); // 固定在屏幕上

    // 输入
    this.cursors = this.input.keyboard!.createCursorKeys();
  }

  update(time: number, delta: number) {
    if (!this.room || !this.currentPlayerId) return;

    // 处理移动输入
    const dx = (this.cursors.left.isDown ? -1 : 0) + (this.cursors.right.isDown ? 1 : 0);
    const dy = (this.cursors.up.isDown ? -1 : 0) + (this.cursors.down.isDown ? 1 : 0);
    const networkManager = NetworkManager.getInstance();

    if (dx !== 0 || dy !== 0) {
      // 复用 networkManager 的 input 发送 (它也支持 village room 因为都是 input 消息)
      // 但 NetworkManager 的 input 包含 seq, angle, shooting 等， VillageRoom 需要适配
      // VillageRoom 期望 { dx, dy, angle }
      // NetworkManager sendInput 发送的是 { dx, dy, angle, shooting, skill, seq }
      // Colyseus 会多余字段忽略或者接受，只要 VillageRoom 定义了 input handler

      // 我们在 VillageRoom 用了 this.handleInput(client, message) 并期望 dx, dy, angle
      // 所以直接调用 networkManager.sendInput 应该兼容
      networkManager.sendInput({
          dx, dy, angle: 0,
          shooting: false, skill: false
      });
    }
  }

  private setupRoomHandlers() {
    if (!this.room) return;

    this.room.state.players.onAdd((player: PlayerState, sessionId: string) => {
      // 创建简单的矩形代表玩家，颜色区分自己和他人
      const isSelf = sessionId === this.currentPlayerId;
      const color = isSelf ? 0x00ff00 : 0xffffff;

      // 使用玩家选择的角色纹理
      let textureKey = player.character;
      if (!this.textures.exists(textureKey)) {
        textureKey = 'char_original'; // Fallback
      }

      const entity = this.add.sprite(player.x, player.y, textureKey);
      entity.setTint(color);

      this.playerEntities[sessionId] = entity;

      // 监听变化
      player.onChange(() => {
          entity.x = player.x;
          entity.y = player.y;
      });
    });

    this.room.state.players.onRemove((player: PlayerState, sessionId: string) => {
      const entity = this.playerEntities[sessionId];
      if (entity) {
        entity.destroy();
        delete this.playerEntities[sessionId];
      }
    });

    // 物品监听
    this.room.state.items.onAdd((item: ItemState, itemId: string) => {
        // 创建代币 (黄色圆形)
        const circle = this.add.circle(item.x, item.y, 8, 0xffff00);
        // 添加闪烁效果
        this.tweens.add({
            targets: circle,
            alpha: 0.5,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // 挂载物理或简单存储Sprite
        // 由于是 circle，我们需要它是 GameObject.
        // add.circle 返回 GameObjects.Arc，它没有 setTexture 但可以作为 entity 存储
        // 为了方便类型，我们可以把它转为 any 或者 cast，或者修改 itemEntities 类型。
        // 为了简单，我们用 make.graphics 生成 texture 然后用 sprite
        if (!this.textures.exists('token_pixel')) {
             const g = this.make.graphics({x:0, y:0, add:false});
             g.fillStyle(0xffff00);
             g.fillCircle(8, 8, 8);
             g.generateTexture('token_pixel', 16, 16);
        }

        const sprite = this.add.sprite(item.x, item.y, 'token_pixel');
        this.itemEntities[itemId] = sprite;
    });

    this.room.state.items.onRemove((item: ItemState, itemId: string) => {
        const entity = this.itemEntities[itemId];
        if (entity) {
            entity.destroy();
            delete this.itemEntities[itemId];
        }
    });

    // 监听拾取事件 (播放特效)
    this.room.onMessage('pickup', (data: { playerId: string, coins: number, x: number, y: number }) => {
        // 显示浮动文字 +10 $PIXEL
        const floatText = this.add.text(data.x, data.y - 20, `+${data.coins} $PIXEL`, {
            fontFamily: '"VT323", monospace',
            fontSize: '20px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.tweens.add({
            targets: floatText,
            y: floatText.y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => floatText.destroy()
        });

        // 如果是自己捡的，更新 UI (也可以通过 player state change 更新，双保险)
        if (data.playerId === this.room?.sessionId) {
            // UI 更新逻辑已在 player.onChange 处理
        }
    });

    // 更新自己金币 UI
    this.room.state.players.onAdd((player, sessionId) => {
        if (sessionId === this.room?.sessionId) {
            player.onChange(() => {
                this.coinText.setText(`$PIXEL: ${player.coins}`);
            });
            // Init
            this.coinText.setText(`$PIXEL: ${player.coins}`);
        }
    });
  }
}
