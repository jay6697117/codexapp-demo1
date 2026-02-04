import Phaser from 'phaser';
import { NetworkManager } from '../network/NetworkManager';

export class ChatUI extends Phaser.GameObjects.Container {
  private chatInput: HTMLInputElement;
  private messageHistory: Phaser.GameObjects.Text[] = [];
  private background: Phaser.GameObjects.Rectangle;
  private networkManager: NetworkManager;

  constructor(scene: Phaser.Scene) {
    super(scene, 10, scene.scale.height - 150);
    this.networkManager = NetworkManager.getInstance();

    // 背景
    this.background = scene.add.rectangle(0, 0, 300, 140, 0x000000, 0.5).setOrigin(0);
    this.add(this.background);

    // HTML 输入框 (叠加在 Canvas 之上)
    this.createInput(scene);

    this.setupListeners();
    scene.add.existing(this);
  }

  private createInput(scene: Phaser.Scene) {
    this.chatInput = document.createElement('input');
    this.chatInput.type = 'text';
    this.chatInput.placeholder = 'Say something...';
    this.chatInput.style.position = 'absolute';
    this.chatInput.style.bottom = '10px';
    this.chatInput.style.left = '10px';
    this.chatInput.style.width = '300px';
    this.chatInput.style.padding = '5px';
    this.chatInput.style.backgroundColor = 'rgba(0,0,0,0.7)';
    this.chatInput.style.color = '#00ff41';
    this.chatInput.style.border = '1px solid #9900ff';
    this.chatInput.style.fontFamily = '"VT323", monospace';
    this.chatInput.style.fontSize = '18px';

    document.body.appendChild(this.chatInput);

    // 自定义按键事件处理，阻止 Phaser 捕获
    this.chatInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
            this.sendMessage();
        }
    });
  }

  private sendMessage() {
    const text = this.chatInput.value.trim();
    if (text && this.networkManager.getRoom()) {
        this.networkManager.getRoom()?.send('chat', { text });
        this.chatInput.value = '';
    }
  }

  private setupListeners() {
    // 监听来自服务器的广播
    // 注意: 这需要在 Room 中实现广播 'chat' 消息
    // VillageRoom 已经有了: this.broadcast('chat', { playerId, text, timestamp })

    const room = this.networkManager.getRoom();
    if (room) {
        room.onMessage('chat', (message: { playerId: string, text: string }) => {
            this.addMessage(`${message.playerId.slice(0,4)}: ${message.text}`);
        });
    }
  }

  private addMessage(text: string) {
      const msgText = this.scene.add.text(5, 120, text, {
          fontFamily: '"VT323", monospace',
          fontSize: '16px',
          color: '#ffffff',
          wordWrap: { width: 290 }
      }).setOrigin(0, 1);

      this.add(msgText);
      this.messageHistory.push(msgText);

      // 滚动效果
      this.messageHistory.forEach((msg, index) => {
          msg.y -= 20;
          msg.alpha = 1 - (this.messageHistory.length - index) * 0.1;
      });

      // 移除旧消息
      if (this.messageHistory.length > 6) {
          const removed = this.messageHistory.shift();
          removed?.destroy();
      }
  }

  destroy() {
      if (this.chatInput) {
          this.chatInput.remove();
      }
      super.destroy();
  }
}
