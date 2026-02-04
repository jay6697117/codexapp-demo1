import * as Colyseus from 'colyseus.js';

// 浏览器兼容的 EventEmitter 实现
class BrowserEventEmitter {
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  on(event: string, callback: (...args: any[]) => void): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return this;
  }

  off(event: string, callback: (...args: any[]) => void): this {
    this.listeners.get(event)?.delete(callback);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const callbacks = this.listeners.get(event);
    if (!callbacks || callbacks.size === 0) return false;
    callbacks.forEach(cb => cb(...args));
    return true;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }
}

export interface JoinOptions {
  name: string;
  character: string;
}

export interface InputData {
  dx: number;
  dy: number;
  angle: number;
  shooting: boolean;
  skill: boolean;
  seq: number;
}

export class NetworkManager extends BrowserEventEmitter {
  private static instance: NetworkManager;
  private client: Colyseus.Client;
  private room: Colyseus.Room | null = null;
  private inputSequence: number = 0;

  private constructor() {
    super();
    // 连接到本地服务器
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'ws://localhost:2567';
    this.client = new Colyseus.Client(serverUrl);
  }

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  async joinOrCreate(options: JoinOptions): Promise<Colyseus.Room> {
    try {
      this.room = await this.client.joinOrCreate('game', options);
      console.log('Joined room:', this.room.id);

      this.setupRoomListeners();
      return this.room;
    } catch (error) {
      console.error('Failed to join room:', error);
      throw error;
    }
  }

  async join(roomId: string, options: JoinOptions): Promise<Colyseus.Room> {
    try {
      this.room = await this.client.joinById(roomId, options);
      console.log('Joined room by ID:', this.room.id);

      this.setupRoomListeners();
      return this.room;
    } catch (error) {
      console.error('Failed to join room by ID:', error);
      throw error;
    }
  }

  private setupRoomListeners() {
    if (!this.room) return;

    // 房间状态变化
    this.room.onStateChange((state) => {
      this.emit('stateChange', state);
    });

    // 玩家加入
    this.room.state.players.onAdd((player: any, sessionId: string) => {
      console.log('Player joined:', sessionId, player.name);
      this.emit('playerJoin', { sessionId, player });
    });

    // 玩家离开
    this.room.state.players.onRemove((player: any, sessionId: string) => {
      console.log('Player left:', sessionId);
      this.emit('playerLeave', { sessionId, player });
    });

    // 道具变化
    this.room.state.items.onAdd((item: any, itemId: string) => {
      this.emit('itemAdd', { itemId, item });
    });

    this.room.state.items.onRemove((item: any, itemId: string) => {
      this.emit('itemRemove', { itemId, item });
    });

    // 子弹消息
    this.room.onMessage('bullet', (data) => {
      this.emit('bullet', data);
    });

    // 技能消息
    this.room.onMessage('skill', (data) => {
      this.emit('skill', data);
    });

    // 击杀消息
    this.room.onMessage('kill', (data) => {
      this.emit('kill', data);
    });

    // 伤害消息（服务器权威判定）
    this.room.onMessage('damage', (data) => {
      this.emit('damage', data);
    });

    // 道具拾取消息（服务器权威判定）
    this.room.onMessage('pickup', (data) => {
      this.emit('pickup', data);
    });

    // 游戏结束
    this.room.onMessage('gameEnd', (data) => {
      this.emit('gameEnd', data);
    });

    // 错误处理
    this.room.onError((code, message) => {
      console.error('Room error:', code, message);
      this.emit('error', { code, message });
    });

    // 断开连接
    this.room.onLeave((code) => {
      console.log('Left room:', code);
      this.emit('leave', code);
      this.room = null;
    });
  }

  sendInput(input: Omit<InputData, 'seq'>) {
    if (!this.room) return;

    this.room.send('input', {
      ...input,
      seq: ++this.inputSequence,
    });
  }

  sendShoot(angle: number) {
    if (!this.room) return;
    this.room.send('shoot', { angle });
  }

  sendSkill(angle: number) {
    if (!this.room) return;
    this.room.send('skill', { angle });
  }

  sendReload() {
    if (!this.room) return;
    this.room.send('reload', {});
  }

  leave() {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
  }

  getRoom(): Colyseus.Room | null {
    return this.room;
  }

  getSessionId(): string | null {
    return this.room?.sessionId || null;
  }

  isConnected(): boolean {
    return this.room !== null;
  }
}

export const networkManager = NetworkManager.getInstance();
