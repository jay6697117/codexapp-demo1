import Phaser from 'phaser';

interface KillMessage {
  id: number;
  container: Phaser.GameObjects.Container;
  createdAt: number;
}

export class KillFeed {
  private scene: Phaser.Scene;
  private messages: KillMessage[] = [];
  private messageId: number = 0;
  private readonly maxMessages: number = 5;
  private readonly messageDuration: number = 5000; // 5秒后消失
  private readonly fadeOutDuration: number = 500;
  private readonly startX: number;
  private readonly startY: number;
  private readonly messageHeight: number = 28;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // 右上角显示
    this.startX = scene.cameras.main.width - 10;
    this.startY = 60;
  }

  addKill(killerName: string, victimName: string, isLocalKiller: boolean = false, isLocalVictim: boolean = false) {
    const id = ++this.messageId;

    // 创建容器
    const container = this.scene.add.container(this.startX, this.startY);
    container.setScrollFactor(0);
    container.setDepth(1001);
    container.setAlpha(0);

    // 背景
    const bgWidth = 200;
    const bg = this.scene.add.rectangle(-bgWidth / 2, 0, bgWidth, 24, 0x000000, 0.6);
    bg.setOrigin(0.5);
    container.add(bg);

    // 击杀者名字颜色
    const killerColor = isLocalKiller ? '#00ff00' : '#ffffff';
    const victimColor = isLocalVictim ? '#ff0000' : '#ffffff';

    // 击杀者名字
    const killerText = this.scene.add.text(-bgWidth / 2 + 10, 0, killerName, {
      fontSize: '12px',
      color: killerColor,
      fontStyle: 'bold',
    });
    killerText.setOrigin(0, 0.5);
    container.add(killerText);

    // 击杀图标（简单用文字代替）
    const iconText = this.scene.add.text(0, 0, '>', {
      fontSize: '12px',
      color: '#ff4444',
    });
    iconText.setOrigin(0.5);
    container.add(iconText);

    // 被击杀者名字
    const victimText = this.scene.add.text(bgWidth / 2 - 10, 0, victimName, {
      fontSize: '12px',
      color: victimColor,
      fontStyle: 'bold',
    });
    victimText.setOrigin(1, 0.5);
    container.add(victimText);

    // 添加到消息列表
    const message: KillMessage = {
      id,
      container,
      createdAt: Date.now(),
    };
    this.messages.unshift(message);

    // 移除多余的消息
    while (this.messages.length > this.maxMessages) {
      const oldMessage = this.messages.pop();
      if (oldMessage) {
        oldMessage.container.destroy();
      }
    }

    // 重新排列消息位置
    this.repositionMessages();

    // 淡入动画
    this.scene.tweens.add({
      targets: container,
      alpha: 1,
      duration: 200,
      ease: 'Power2',
    });

    // 设置自动消失
    this.scene.time.delayedCall(this.messageDuration, () => {
      this.fadeOutMessage(id);
    });
  }

  addZoneKill(victimName: string, isLocalVictim: boolean = false) {
    const id = ++this.messageId;

    const container = this.scene.add.container(this.startX, this.startY);
    container.setScrollFactor(0);
    container.setDepth(1001);
    container.setAlpha(0);

    const bgWidth = 180;
    const bg = this.scene.add.rectangle(-bgWidth / 2, 0, bgWidth, 24, 0x000000, 0.6);
    bg.setOrigin(0.5);
    container.add(bg);

    const victimColor = isLocalVictim ? '#ff0000' : '#ffffff';

    // 毒圈图标
    const zoneIcon = this.scene.add.text(-bgWidth / 2 + 10, 0, '[X]', {
      fontSize: '12px',
      color: '#ff6666',
    });
    zoneIcon.setOrigin(0, 0.5);
    container.add(zoneIcon);

    // 被击杀者名字
    const victimText = this.scene.add.text(0, 0, victimName, {
      fontSize: '12px',
      color: victimColor,
      fontStyle: 'bold',
    });
    victimText.setOrigin(0.5);
    container.add(victimText);

    // 后缀文字
    const suffixText = this.scene.add.text(bgWidth / 2 - 10, 0, '被毒圈击杀', {
      fontSize: '11px',
      color: '#ff6666',
    });
    suffixText.setOrigin(1, 0.5);
    container.add(suffixText);

    const message: KillMessage = {
      id,
      container,
      createdAt: Date.now(),
    };
    this.messages.unshift(message);

    while (this.messages.length > this.maxMessages) {
      const oldMessage = this.messages.pop();
      if (oldMessage) {
        oldMessage.container.destroy();
      }
    }

    this.repositionMessages();

    this.scene.tweens.add({
      targets: container,
      alpha: 1,
      duration: 200,
      ease: 'Power2',
    });

    this.scene.time.delayedCall(this.messageDuration, () => {
      this.fadeOutMessage(id);
    });
  }

  private fadeOutMessage(id: number) {
    const index = this.messages.findIndex(m => m.id === id);
    if (index === -1) return;

    const message = this.messages[index];

    this.scene.tweens.add({
      targets: message.container,
      alpha: 0,
      duration: this.fadeOutDuration,
      ease: 'Power2',
      onComplete: () => {
        message.container.destroy();
        // 重新查找索引，因为可能已经变化
        const currentIndex = this.messages.findIndex(m => m.id === id);
        if (currentIndex !== -1) {
          this.messages.splice(currentIndex, 1);
        }
        this.repositionMessages();
      },
    });
  }

  private repositionMessages() {
    this.messages.forEach((message, index) => {
      this.scene.tweens.add({
        targets: message.container,
        y: this.startY + index * this.messageHeight,
        duration: 150,
        ease: 'Power2',
      });
    });
  }

  destroy() {
    this.messages.forEach(message => {
      message.container.destroy();
    });
    this.messages = [];
  }
}
