import Phaser from 'phaser';
import { phaserConfig } from './config';

// 暂时用空场景测试
class TestScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TestScene' });
  }

  create() {
    const text = this.add.text(400, 300, 'Pixel Arena\n像素竞技场', {
      fontSize: '48px',
      color: '#ffffff',
      align: 'center',
    });
    text.setOrigin(0.5);

    const subText = this.add.text(400, 400, '游戏加载中...', {
      fontSize: '24px',
      color: '#888888',
    });
    subText.setOrigin(0.5);
  }
}

const config: Phaser.Types.Core.GameConfig = {
  ...phaserConfig,
  scene: [TestScene],
};

// 启动游戏
const game = new Phaser.Game(config);

// 热更新支持
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.destroy(true);
  });
}
