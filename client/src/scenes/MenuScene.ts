import Phaser from 'phaser';
import { networkManager } from '../network';
import { RoomListUI, RoomInfo } from '../ui/RoomListUI';

export class MenuScene extends Phaser.Scene {
  private connectingText?: Phaser.GameObjects.Text;
  private roomListUI!: RoomListUI;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // 标题
    const title = this.add.text(width / 2, 100, 'PIXEL ARENA', {
      fontSize: '48px',
      color: '#00ff00',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // 副标题
    const subtitle = this.add.text(width / 2, 160, '像素竞技场', {
      fontSize: '24px',
      color: '#888888',
    });
    subtitle.setOrigin(0.5);

    // 单人游戏按钮
    const singlePlayerButton = this.add.text(width / 2, height / 2 - 40, '[ 单人游戏 ]', {
      fontSize: '32px',
      color: '#ffffff',
      padding: { x: 20, y: 10 },
    });
    singlePlayerButton.setOrigin(0.5);
    singlePlayerButton.setInteractive({ useHandCursor: true });

    singlePlayerButton.on('pointerover', () => {
      singlePlayerButton.setColor('#00ff00');
      singlePlayerButton.setScale(1.1);
    });

    singlePlayerButton.on('pointerout', () => {
      singlePlayerButton.setColor('#ffffff');
      singlePlayerButton.setScale(1);
    });

    singlePlayerButton.on('pointerdown', () => {
      this.scene.start('GameScene', { multiplayer: false });
    });

    // 多人游戏按钮
    const multiPlayerButton = this.add.text(width / 2, height / 2 + 40, '[ 多人游戏 ]', {
      fontSize: '32px',
      color: '#ffffff',
      padding: { x: 20, y: 10 },
    });
    multiPlayerButton.setOrigin(0.5);
    multiPlayerButton.setInteractive({ useHandCursor: true });

    multiPlayerButton.on('pointerover', () => {
      multiPlayerButton.setColor('#00ffff');
      multiPlayerButton.setScale(1.1);
    });

    multiPlayerButton.on('pointerout', () => {
      multiPlayerButton.setColor('#ffffff');
      multiPlayerButton.setScale(1);
    });

    multiPlayerButton.on('pointerdown', () => {
      this.startMultiplayerGame();
    });

    // 房间列表按钮
    const roomListButton = this.add.text(width / 2, height / 2 + 120, '[ 房间列表 ]', {
      fontSize: '32px',
      color: '#ffffff',
      padding: { x: 20, y: 10 },
    });
    roomListButton.setOrigin(0.5);
    roomListButton.setInteractive({ useHandCursor: true });

    roomListButton.on('pointerover', () => {
      roomListButton.setColor('#ff9900');
      roomListButton.setScale(1.1);
    });

    roomListButton.on('pointerout', () => {
      roomListButton.setColor('#ffffff');
      roomListButton.setScale(1);
    });

    roomListButton.on('pointerdown', () => {
      this.showRoomList();
    });

    // 连接中提示（初始隐藏）
    this.connectingText = this.add.text(width / 2, height / 2 + 200, '连接服务器中...', {
      fontSize: '18px',
      color: '#ffaa00',
    });
    this.connectingText.setOrigin(0.5);
    this.connectingText.setVisible(false);

    // 操作说明
    const instructions = this.add.text(width / 2, height - 100,
      'WASD 移动 | 鼠标瞄准 | 左键射击 | Q 技能', {
      fontSize: '16px',
      color: '#666666',
    });
    instructions.setOrigin(0.5);

    // 版本号
    this.add.text(10, height - 30, 'v0.2.0', {
      fontSize: '14px',
      color: '#444444',
    });

    // 初始化房间列表 UI
    this.roomListUI = new RoomListUI(this);
    this.roomListUI.setCallbacks({
      onJoinRoom: (roomId) => this.joinRoom(roomId),
      onCreateRoom: () => this.createRoom(),
      onQuickMatch: () => this.quickMatch(),
      onRefresh: () => this.refreshRooms(),
    });
  }

  private showRoomList() {
    this.roomListUI.show();
    this.refreshRooms();
  }

  private async refreshRooms() {
    // 模拟获取房间列表（实际应从服务器获取）
    // TODO: 替换为实际的 networkManager.getRoomList() 调用
    const mockRooms: RoomInfo[] = [
      { roomId: '1', name: '新手房间', playerCount: 3, maxPlayers: 8, status: 'waiting', mapName: '森林' },
      { roomId: '2', name: '高手对决', playerCount: 6, maxPlayers: 8, status: 'playing', mapName: '沙漠' },
      { roomId: '3', name: '休闲娱乐', playerCount: 2, maxPlayers: 4, status: 'waiting', mapName: '雪地' },
    ];
    this.roomListUI.updateRooms(mockRooms);
  }

  private async joinRoom(roomId: string) {
    if (!this.connectingText) return;

    this.roomListUI.hide();
    this.connectingText.setVisible(true);
    this.connectingText.setText('加入房间中...');
    this.connectingText.setColor('#ffaa00');

    try {
      // TODO: 替换为实际的 networkManager.joinRoom(roomId) 调用
      await networkManager.joinOrCreate({
        name: 'Player_' + Math.floor(Math.random() * 10000),
        character: 'assault',
        roomId: roomId,
      });

      this.connectingText.setText('加入成功!');
      this.connectingText.setColor('#00ff00');

      this.time.delayedCall(500, () => {
        this.scene.start('GameScene', { multiplayer: true });
      });
    } catch (error) {
      console.error('Failed to join room:', error);
      this.connectingText.setText('加入失败，请重试');
      this.connectingText.setColor('#ff0000');

      this.time.delayedCall(3000, () => {
        if (this.connectingText) {
          this.connectingText.setVisible(false);
        }
      });
    }
  }

  private async createRoom() {
    if (!this.connectingText) return;

    this.roomListUI.hide();
    this.connectingText.setVisible(true);
    this.connectingText.setText('创建房间中...');
    this.connectingText.setColor('#ffaa00');

    try {
      // TODO: 替换为实际的 networkManager.createRoom() 调用
      await networkManager.joinOrCreate({
        name: 'Player_' + Math.floor(Math.random() * 10000),
        character: 'assault',
        createNew: true,
      });

      this.connectingText.setText('创建成功!');
      this.connectingText.setColor('#00ff00');

      this.time.delayedCall(500, () => {
        this.scene.start('GameScene', { multiplayer: true });
      });
    } catch (error) {
      console.error('Failed to create room:', error);
      this.connectingText.setText('创建失败，请重试');
      this.connectingText.setColor('#ff0000');

      this.time.delayedCall(3000, () => {
        if (this.connectingText) {
          this.connectingText.setVisible(false);
        }
      });
    }
  }

  private async quickMatch() {
    if (!this.connectingText) return;

    this.roomListUI.hide();
    this.connectingText.setVisible(true);
    this.connectingText.setText('快速匹配中...');
    this.connectingText.setColor('#ffaa00');

    try {
      // 快速匹配 - 加入第一个可用房间或创建新房间
      await networkManager.joinOrCreate({
        name: 'Player_' + Math.floor(Math.random() * 10000),
        character: 'assault',
      });

      this.connectingText.setText('匹配成功!');
      this.connectingText.setColor('#00ff00');

      this.time.delayedCall(500, () => {
        this.scene.start('GameScene', { multiplayer: true });
      });
    } catch (error) {
      console.error('Failed to quick match:', error);
      this.connectingText.setText('匹配失败，请重试');
      this.connectingText.setColor('#ff0000');

      this.time.delayedCall(3000, () => {
        if (this.connectingText) {
          this.connectingText.setVisible(false);
        }
      });
    }
  }

  private async startMultiplayerGame() {
    if (!this.connectingText) return;

    this.connectingText.setVisible(true);
    this.connectingText.setText('连接服务器中...');
    this.connectingText.setColor('#ffaa00');

    try {
      // 连接到服务器
      await networkManager.joinOrCreate({
        name: 'Player_' + Math.floor(Math.random() * 10000),
        character: 'assault',
      });

      this.connectingText.setText('连接成功!');
      this.connectingText.setColor('#00ff00');

      // 短暂显示成功信息后进入游戏
      this.time.delayedCall(500, () => {
        this.scene.start('GameScene', { multiplayer: true });
      });
    } catch (error) {
      console.error('Failed to connect:', error);
      this.connectingText.setText('连接失败，请重试');
      this.connectingText.setColor('#ff0000');

      // 3秒后隐藏错误信息
      this.time.delayedCall(3000, () => {
        if (this.connectingText) {
          this.connectingText.setVisible(false);
        }
      });
    }
  }
}
