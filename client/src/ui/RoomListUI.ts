import Phaser from 'phaser';

export interface RoomInfo {
  roomId: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  mapName: string;
}

export class RoomListUI {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private roomItems: Phaser.GameObjects.Container[] = [];
  private rooms: RoomInfo[] = [];
  private selectedRoomId: string | null = null;

  private onJoinRoom: ((roomId: string) => void) | null = null;
  private onCreateRoom: (() => void) | null = null;
  private onQuickMatch: (() => void) | null = null;
  private onRefresh: (() => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(1000);
    this.container.setVisible(false);
    this.createUI();
  }

  private createUI() {
    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    // 背景遮罩
    const overlay = this.scene.add.rectangle(centerX, centerY, width, height, 0x000000, 0.7);
    this.container.add(overlay);

    // 主面板
    const panelWidth = 600;
    const panelHeight = 500;
    const panel = this.scene.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x1a1a2e, 0.95);
    panel.setStrokeStyle(3, 0x4a4a6a);
    this.container.add(panel);

    // 标题
    const title = this.scene.add.text(centerX, centerY - 220, '房间列表', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // 按钮区域
    const buttonY = centerY - 170;
    const buttonSpacing = 150;

    // 快速匹配按钮
    this.createButton(centerX - buttonSpacing, buttonY, '快速匹配', 0x27ae60, () => {
      this.onQuickMatch?.();
    });

    // 创建房间按钮
    this.createButton(centerX, buttonY, '创建房间', 0x3498db, () => {
      this.onCreateRoom?.();
    });

    // 刷新按钮
    this.createButton(centerX + buttonSpacing, buttonY, '刷新列表', 0x7f8c8d, () => {
      this.onRefresh?.();
    });

    // 房间列表表头
    const headerY = centerY - 120;
    const headers = ['房间名称', '玩家', '状态', '地图'];
    const headerX = [centerX - 200, centerX - 50, centerX + 80, centerX + 180];

    headers.forEach((header, i) => {
      const text = this.scene.add.text(headerX[i], headerY, header, {
        fontSize: '14px',
        color: '#888888',
      });
      text.setOrigin(0.5);
      this.container.add(text);
    });

    // 分隔线
    const line = this.scene.add.rectangle(centerX, headerY + 15, panelWidth - 40, 1, 0x4a4a6a);
    this.container.add(line);

    // 关闭按钮
    const closeBtn = this.scene.add.text(centerX + panelWidth / 2 - 20, centerY - panelHeight / 2 + 20, 'X', {
      fontSize: '24px',
      color: '#ffffff',
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hide());
    closeBtn.on('pointerover', () => closeBtn.setColor('#ff6666'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#ffffff'));
    this.container.add(closeBtn);

    // 加入房间按钮（底部）
    this.createButton(centerX, centerY + 200, '加入房间', 0xe74c3c, () => {
      if (this.selectedRoomId) {
        this.onJoinRoom?.(this.selectedRoomId);
      }
    });
  }

  private createButton(x: number, y: number, text: string, color: number, onClick: () => void) {
    const btn = this.scene.add.rectangle(x, y, 120, 40, color);
    btn.setInteractive({ useHandCursor: true });

    // Create lighter color for stroke
    const colorObj = Phaser.Display.Color.ValueToColor(color);
    const lighterColor = colorObj.clone().lighten(30);
    btn.setStrokeStyle(2, lighterColor.color);

    const btnText = this.scene.add.text(x, y, text, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    btnText.setOrigin(0.5);

    btn.on('pointerover', () => {
      const hoverColor = Phaser.Display.Color.ValueToColor(color).lighten(20);
      btn.setFillStyle(hoverColor.color);
    });
    btn.on('pointerout', () => btn.setFillStyle(color));
    btn.on('pointerdown', onClick);

    this.container.add(btn);
    this.container.add(btnText);
  }

  updateRooms(rooms: RoomInfo[]) {
    this.rooms = rooms;
    this.renderRoomList();
  }

  private renderRoomList() {
    // 清除旧的房间项
    this.roomItems.forEach(item => item.destroy());
    this.roomItems = [];

    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;
    const startY = centerY - 90;
    const rowHeight = 40;

    this.rooms.slice(0, 6).forEach((room, index) => {
      const y = startY + index * rowHeight;
      const itemContainer = this.scene.add.container(0, 0);

      // 行背景
      const isSelected = room.roomId === this.selectedRoomId;
      const bgColor = isSelected ? 0x3498db : (index % 2 === 0 ? 0x2a2a4e : 0x1a1a2e);
      const rowBg = this.scene.add.rectangle(centerX, y, 560, 35, bgColor, 0.8);
      rowBg.setInteractive({ useHandCursor: true });
      rowBg.on('pointerdown', () => {
        this.selectedRoomId = room.roomId;
        this.renderRoomList();
      });
      rowBg.on('pointerover', () => {
        if (!isSelected) rowBg.setFillStyle(0x3a3a5e, 0.8);
      });
      rowBg.on('pointerout', () => {
        if (!isSelected) rowBg.setFillStyle(bgColor, 0.8);
      });
      itemContainer.add(rowBg);

      // 房间名称
      const nameText = this.scene.add.text(centerX - 200, y, room.name, {
        fontSize: '14px',
        color: '#ffffff',
      });
      nameText.setOrigin(0.5);
      itemContainer.add(nameText);

      // 玩家数量
      const playerText = this.scene.add.text(centerX - 50, y, `${room.playerCount}/${room.maxPlayers}`, {
        fontSize: '14px',
        color: room.playerCount >= room.maxPlayers ? '#ff6666' : '#ffffff',
      });
      playerText.setOrigin(0.5);
      itemContainer.add(playerText);

      // 状态
      const statusColors: Record<string, string> = {
        waiting: '#00ff00',
        playing: '#ffcc00',
        finished: '#888888',
      };
      const statusNames: Record<string, string> = {
        waiting: '等待中',
        playing: '游戏中',
        finished: '已结束',
      };
      const statusText = this.scene.add.text(centerX + 80, y, statusNames[room.status], {
        fontSize: '14px',
        color: statusColors[room.status],
      });
      statusText.setOrigin(0.5);
      itemContainer.add(statusText);

      // 地图
      const mapText = this.scene.add.text(centerX + 180, y, room.mapName, {
        fontSize: '14px',
        color: '#aaaaaa',
      });
      mapText.setOrigin(0.5);
      itemContainer.add(mapText);

      this.container.add(itemContainer);
      this.roomItems.push(itemContainer);
    });

    // 无房间提示
    if (this.rooms.length === 0) {
      const noRoomText = this.scene.add.text(centerX, startY + 60, '暂无可用房间，请创建新房间或使用快速匹配', {
        fontSize: '14px',
        color: '#888888',
      });
      noRoomText.setOrigin(0.5);
      const itemContainer = this.scene.add.container(0, 0);
      itemContainer.add(noRoomText);
      this.container.add(itemContainer);
      this.roomItems.push(itemContainer);
    }
  }

  setCallbacks(callbacks: {
    onJoinRoom?: (roomId: string) => void;
    onCreateRoom?: () => void;
    onQuickMatch?: () => void;
    onRefresh?: () => void;
  }) {
    this.onJoinRoom = callbacks.onJoinRoom ?? null;
    this.onCreateRoom = callbacks.onCreateRoom ?? null;
    this.onQuickMatch = callbacks.onQuickMatch ?? null;
    this.onRefresh = callbacks.onRefresh ?? null;
  }

  show() {
    this.container.setVisible(true);
    this.selectedRoomId = null;
    this.renderRoomList();
  }

  hide() {
    this.container.setVisible(false);
  }

  isVisible(): boolean {
    return this.container.visible;
  }

  destroy() {
    this.container.destroy();
  }
}
