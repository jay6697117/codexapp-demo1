import Phaser from 'phaser';

export interface LeaderboardEntry {
  id: string;
  name: string;
  kills: number;
  isAlive: boolean;
  isLocal: boolean;
}

export class Leaderboard {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private entries: LeaderboardEntry[] = [];
  private readonly maxDisplay: number = 5;
  private readonly startX: number;
  private readonly startY: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.startX = 10;
    this.startY = 10;

    this.container = scene.add.container(this.startX, this.startY);
    this.container.setScrollFactor(0);
    this.container.setDepth(900);
  }

  update(entries: LeaderboardEntry[], alivePlayers: number, totalPlayers: number) {
    this.entries = entries;
    this.render(alivePlayers, totalPlayers);
  }

  private render(alivePlayers: number, totalPlayers: number) {
    // 清除之前的内容
    this.container.removeAll(true);

    // 背景面板
    const panelWidth = 160;
    const panelHeight = 30 + this.maxDisplay * 22 + 10;
    const bg = this.scene.add.rectangle(0, 0, panelWidth, panelHeight, 0x000000, 0.5);
    bg.setOrigin(0, 0);
    this.container.add(bg);

    // 存活人数标题
    const aliveText = this.scene.add.text(panelWidth / 2, 8, `存活: ${alivePlayers}/${totalPlayers}`, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    aliveText.setOrigin(0.5, 0);
    this.container.add(aliveText);

    // 分隔线
    const line = this.scene.add.rectangle(panelWidth / 2, 28, panelWidth - 20, 1, 0x444444);
    this.container.add(line);

    // 按击杀数排序，取前 N 名
    const sorted = [...this.entries]
      .filter(e => e.isAlive)
      .sort((a, b) => b.kills - a.kills)
      .slice(0, this.maxDisplay);

    // 渲染排行榜条目
    sorted.forEach((entry, index) => {
      const y = 38 + index * 22;
      const isLocal = entry.isLocal;
      const color = isLocal ? '#00ff00' : '#ffffff';

      // 排名
      const rankText = this.scene.add.text(10, y, `${index + 1}.`, {
        fontSize: '12px',
        color: '#888888',
      });
      this.container.add(rankText);

      // 玩家名 (最多显示 8 个字符)
      const displayName = entry.name.length > 8 ? entry.name.slice(0, 8) + '..' : entry.name;
      const nameText = this.scene.add.text(30, y, displayName, {
        fontSize: '12px',
        color: color,
        fontStyle: isLocal ? 'bold' : 'normal',
      });
      this.container.add(nameText);

      // 击杀数
      const killsText = this.scene.add.text(panelWidth - 10, y, `${entry.kills} 杀`, {
        fontSize: '12px',
        color: '#ffcc00',
      });
      killsText.setOrigin(1, 0);
      this.container.add(killsText);
    });

    // 如果本地玩家不在前 N 名但还存活，显示其排名
    const localEntry = this.entries.find(e => e.isLocal && e.isAlive);
    if (localEntry) {
      const localRank = [...this.entries]
        .filter(e => e.isAlive)
        .sort((a, b) => b.kills - a.kills)
        .findIndex(e => e.id === localEntry.id) + 1;

      if (localRank > this.maxDisplay) {
        const y = 38 + this.maxDisplay * 22;

        // 分隔点
        const dots = this.scene.add.text(panelWidth / 2, y - 5, '...', {
          fontSize: '10px',
          color: '#666666',
        });
        dots.setOrigin(0.5, 0);
        this.container.add(dots);

        // 本地玩家信息
        const localY = y + 10;
        const rankText = this.scene.add.text(10, localY, `${localRank}.`, {
          fontSize: '12px',
          color: '#888888',
        });
        this.container.add(rankText);

        const displayName = localEntry.name.length > 8 ? localEntry.name.slice(0, 8) + '..' : localEntry.name;
        const nameText = this.scene.add.text(30, localY, displayName, {
          fontSize: '12px',
          color: '#00ff00',
          fontStyle: 'bold',
        });
        this.container.add(nameText);

        const killsText = this.scene.add.text(panelWidth - 10, localY, `${localEntry.kills} 杀`, {
          fontSize: '12px',
          color: '#ffcc00',
        });
        killsText.setOrigin(1, 0);
        this.container.add(killsText);
      }
    }
  }

  setVisible(visible: boolean) {
    this.container.setVisible(visible);
  }

  destroy() {
    this.container.destroy();
  }
}
