import Phaser from 'phaser';
import { phaserConfig } from './config';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';

const config: Phaser.Types.Core.GameConfig = {
  ...phaserConfig,
  scene: [BootScene, MenuScene],
};

// 启动游戏
const game = new Phaser.Game(config);

// 热更新支持
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.destroy(true);
  });
}
