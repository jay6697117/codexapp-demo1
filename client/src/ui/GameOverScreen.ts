import Phaser from 'phaser';

export interface PlayerResult {
  id: string;
  name: string;
  rank: number;
  kills: number;
  damage: number;
  isLocal: boolean;
}

export class GameOverScreen {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private isVisible: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(2000);
    this.container.setVisible(false);
  }

  show(localRank: number, totalPlayers: number, results: PlayerResult[]) {
    if (this.isVisible) return;
    this.isVisible = true;

    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    // 半透明背景
    const overlay = this.scene.add.rectangle(centerX, centerY, width, height, 0x000000, 0.8);
    this.container.add(overlay);

    // 主面板
    const panelWidth = 500;
    const panelHeight = 400;
    const panel = this.scene.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x1a1a2e, 0.95);
    panel.setStrokeStyle(3, 0x4a4a6a);
    this.container.add(panel);

    // 标题 - 根据排名显示不同内容
    const isWinner = localRank === 1;
    const titleText = isWinner ? 'Victory!' : `#${localRank}`;
    const titleColor = isWinner ? '#ffd700' : '#ffffff';

    const title = this.scene.add.text(centerX, centerY - 160, titleText, {
      fontSize: '48px',
      color: titleColor,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // 副标题
    const subtitle = this.scene.add.text(centerX, centerY - 110, `${totalPlayers} Players`, {
      fontSize: '16px',
      color: '#aaaaaa',
    });
    subtitle.setOrigin(0.5);
    this.container.add(subtitle);

    // 排行榜标题
    const leaderboardTitle = this.scene.add.text(centerX, centerY - 70, 'Leaderboard', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    leaderboardTitle.setOrigin(0.5);
    this.container.add(leaderboardTitle);

    // 表头
    const headerY = centerY - 40;
    const headers = ['Rank', 'Player', 'Kills', 'Damage'];
    const headerXPositions = [centerX - 180, centerX - 80, centerX + 60, centerX + 150];

    headers.forEach((header, i) => {
      const headerText = this.scene.add.text(headerXPositions[i], headerY, header, {
        fontSize: '14px',
        color: '#888888',
      });
      headerText.setOrigin(0.5);
      this.container.add(headerText);
    });

    // 分隔线
    const line = this.scene.add.rectangle(centerX, headerY + 15, panelWidth - 40, 1, 0x4a4a6a);
    this.container.add(line);

    // 排行榜内容 (最多显示 5 名)
    const sortedResults = [...results].sort((a, b) => a.rank - b.rank).slice(0, 5);

    sortedResults.forEach((result, index) => {
      const rowY = centerY - 10 + index * 35;
      const rowColor = result.isLocal ? '#00ff00' : '#ffffff';
      const bgColor = result.isLocal ? 0x003300 : (index % 2 === 0 ? 0x2a2a4e : 0x1a1a2e);

      // 行背景
      const rowBg = this.scene.add.rectangle(centerX, rowY, panelWidth - 50, 30, bgColor, 0.5);
      this.container.add(rowBg);

      // 排名图标
      let rankDisplay = `#${result.rank}`;
      if (result.rank === 1) rankDisplay = '1st';
      else if (result.rank === 2) rankDisplay = '2nd';
      else if (result.rank === 3) rankDisplay = '3rd';

      const rankText = this.scene.add.text(headerXPositions[0], rowY, rankDisplay, {
        fontSize: '16px',
        color: rowColor,
      });
      rankText.setOrigin(0.5);
      this.container.add(rankText);

      // 玩家名
      const nameText = this.scene.add.text(headerXPositions[1], rowY, result.name, {
        fontSize: '14px',
        color: rowColor,
        fontStyle: result.isLocal ? 'bold' : 'normal',
      });
      nameText.setOrigin(0.5);
      this.container.add(nameText);

      // 击杀数
      const killsText = this.scene.add.text(headerXPositions[2], rowY, `${result.kills}`, {
        fontSize: '14px',
        color: rowColor,
      });
      killsText.setOrigin(0.5);
      this.container.add(killsText);

      // 伤害
      const damageText = this.scene.add.text(headerXPositions[3], rowY, `${result.damage}`, {
        fontSize: '14px',
        color: rowColor,
      });
      damageText.setOrigin(0.5);
      this.container.add(damageText);
    });

    // 返回按钮
    const buttonY = centerY + 150;
    const button = this.scene.add.rectangle(centerX, buttonY, 200, 50, 0x4a90d9);
    button.setInteractive({ useHandCursor: true });
    button.setStrokeStyle(2, 0x6ab0f9);
    this.container.add(button);

    const buttonText = this.scene.add.text(centerX, buttonY, 'Return to Lobby', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    buttonText.setOrigin(0.5);
    this.container.add(buttonText);

    // 按钮交互
    button.on('pointerover', () => {
      button.setFillStyle(0x6ab0f9);
    });
    button.on('pointerout', () => {
      button.setFillStyle(0x4a90d9);
    });
    button.on('pointerdown', () => {
      this.hide();
      this.scene.scene.start('MenuScene');
    });

    // 显示动画
    this.container.setAlpha(0);
    this.container.setVisible(true);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    });
  }

  hide() {
    if (!this.isVisible) return;

    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.container.removeAll(true);
        this.container.setVisible(false);
        this.isVisible = false;
      },
    });
  }

  destroy() {
    this.container.destroy();
  }
}
