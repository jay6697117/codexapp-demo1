# Pixel Arena 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个基于 Phaser 3 + Colyseus 的在线多人竞技像素游戏

**Architecture:** 采用 monorepo 结构，分为 client（Phaser 3 游戏客户端）、server（Colyseus 多人服务器）、shared（共享类型和常量）三个包。客户端负责渲染和输入，服务器作为权威源处理所有游戏逻辑。

**Tech Stack:** Phaser 3.70+, Colyseus 0.15+, TypeScript 5.0+, Vite 5.0+, Node.js 20+

**Design Doc:** `docs/plans/2026-02-03-pixel-arena-design.md`

---

## 阶段 1：基础框架

### Task 1.1: 初始化 Monorepo 项目结构

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `client/package.json`
- Create: `server/package.json`
- Create: `shared/package.json`

**Step 1: 创建根目录 package.json (workspace)**

```json
{
  "name": "pixel-arena",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "client",
    "server",
    "shared"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:client": "npm run dev --workspace=client",
    "dev:server": "npm run dev --workspace=server",
    "build": "npm run build --workspaces",
    "clean": "rm -rf node_modules client/node_modules server/node_modules shared/node_modules"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "typescript": "^5.3.3"
  }
}
```

**Step 2: 创建基础 TypeScript 配置**

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

**Step 3: 创建 .gitignore**

```
node_modules/
dist/
.DS_Store
*.log
.env
.env.local
```

**Step 4: 创建 shared/package.json**

```json
{
  "name": "@pixel-arena/shared",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch"
  }
}
```

**Step 5: 创建 client/package.json**

```json
{
  "name": "@pixel-arena/client",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "phaser": "^3.70.0",
    "colyseus.js": "^0.15.0",
    "@pixel-arena/shared": "*"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "vite": "^5.0.0"
  }
}
```

**Step 6: 创建 server/package.json**

```json
{
  "name": "@pixel-arena/server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "colyseus": "^0.15.0",
    "@colyseus/ws-transport": "^0.15.0",
    "express": "^4.18.2",
    "@pixel-arena/shared": "*"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0"
  }
}
```

**Step 7: 安装依赖**

Run: `npm install`
Expected: 成功安装所有依赖，无错误

**Step 8: 提交**

```bash
git add -A
git commit -m "feat: initialize monorepo project structure

- Set up npm workspaces for client/server/shared
- Add base TypeScript configuration
- Configure package dependencies for Phaser 3 and Colyseus"
```

---

### Task 1.2: 配置 Shared 包 - 游戏常量和类型

**Files:**
- Create: `shared/tsconfig.json`
- Create: `shared/src/index.ts`
- Create: `shared/src/constants.ts`
- Create: `shared/src/types.ts`
- Create: `shared/src/messages.ts`

**Step 1: 创建 shared/tsconfig.json**

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**Step 2: 创建游戏常量 shared/src/constants.ts**

```typescript
// 游戏配置常量
export const GAME_CONFIG = {
  // 地图尺寸
  MAP_WIDTH: 1600,
  MAP_HEIGHT: 1200,
  TILE_SIZE: 32,

  // 玩家配置
  PLAYER_SPEED: 200,
  PLAYER_SIZE: 32,
  DEFAULT_HP: 100,

  // 房间配置
  MIN_PLAYERS: 4,
  MAX_PLAYERS: 8,
  LOBBY_WAIT_TIME: 30000, // 30秒
  START_COUNTDOWN: 3000, // 3秒

  // 游戏时长
  GAME_DURATION: 240000, // 4分钟
  ZONE_SHRINK_INTERVAL: 60000, // 每60秒缩圈

  // 网络配置
  SERVER_TICK_RATE: 20, // 每秒20次状态更新
  CLIENT_SEND_RATE: 60, // 每秒60次输入发送
} as const;

// 武器配置
export const WEAPONS = {
  pistol: {
    name: '手枪',
    damage: 10,
    fireRate: 400, // ms
    range: 300,
    magazineSize: 12,
    reloadTime: 2000,
  },
  smg: {
    name: '冲锋枪',
    damage: 7,
    fireRate: 100,
    range: 200,
    magazineSize: 30,
    reloadTime: 2000,
  },
  rifle: {
    name: '步枪',
    damage: 18,
    fireRate: 600,
    range: 500,
    magazineSize: 8,
    reloadTime: 2500,
  },
  shotgun: {
    name: '霰弹枪',
    damage: 25, // per pellet
    pellets: 5,
    fireRate: 1000,
    range: 100,
    magazineSize: 6,
    reloadTime: 3000,
  },
} as const;

// 角色配置
export const CHARACTERS = {
  assault: {
    name: '突击兵',
    hp: 100,
    speedModifier: 1.05,
    skill: 'dash',
    skillCooldown: 5000,
  },
  tank: {
    name: '重装',
    hp: 130,
    speedModifier: 0.9,
    skill: 'shield',
    skillCooldown: 8000,
  },
  ranger: {
    name: '游侠',
    hp: 100,
    speedModifier: 1.0,
    rangeModifier: 1.2,
    skill: 'backflip',
    skillCooldown: 6000,
  },
  medic: {
    name: '医疗兵',
    hp: 100,
    speedModifier: 1.0,
    passiveHeal: 1, // HP per second
    skill: 'healAura',
    skillCooldown: 10000,
  },
} as const;

// 缩圈配置
export const SAFE_ZONE = {
  phases: [
    { time: 0, radiusPercent: 1.0, damage: 0 },
    { time: 60000, radiusPercent: 0.7, damage: 3 },
    { time: 120000, radiusPercent: 0.4, damage: 6 },
    { time: 180000, radiusPercent: 0.15, damage: 10 },
    { time: 240000, radiusPercent: 0.05, damage: 15 },
  ],
  shrinkDuration: 10000, // 10秒缩圈动画
} as const;
```

**Step 3: 创建类型定义 shared/src/types.ts**

```typescript
import { WEAPONS, CHARACTERS } from './constants';

// 武器类型
export type WeaponType = keyof typeof WEAPONS;

// 角色类型
export type CharacterType = keyof typeof CHARACTERS;

// 房间阶段
export type RoomPhase = 'waiting' | 'starting' | 'playing' | 'ended';

// 玩家输入
export interface PlayerInput {
  dx: number; // -1 to 1
  dy: number; // -1 to 1
  angle: number; // 朝向角度
  shooting: boolean;
  skill: boolean;
}

// 玩家状态
export interface IPlayerState {
  id: string;
  name: string;
  character: CharacterType;
  x: number;
  y: number;
  angle: number;
  hp: number;
  maxHp: number;
  weapon: WeaponType;
  ammo: number;
  isAlive: boolean;
  kills: number;
  damage: number;
  skillCooldown: number;
  itemSkill: string | null;
}

// 道具状态
export interface IItemState {
  id: string;
  type: 'weapon' | 'skill';
  subType: string;
  x: number;
  y: number;
  isActive: boolean;
}

// 安全区状态
export interface ISafeZone {
  x: number;
  y: number;
  radius: number;
  nextX: number;
  nextY: number;
  nextRadius: number;
  shrinking: boolean;
}

// 房间状态
export interface IRoomState {
  phase: RoomPhase;
  countdown: number;
  elapsedTime: number;
  safeZone: ISafeZone;
  players: Map<string, IPlayerState>;
  items: Map<string, IItemState>;
  alivePlayers: number;
}

// 游戏结果
export interface GameResult {
  rank: number;
  kills: number;
  damage: number;
  survivalTime: number;
}
```

**Step 4: 创建消息类型定义 shared/src/messages.ts**

```typescript
import { PlayerInput, CharacterType, WeaponType } from './types';

// 客户端 -> 服务器 消息
export interface JoinOptions {
  name: string;
  character: CharacterType;
}

export interface InputMessage {
  type: 'input';
  input: PlayerInput;
  seq: number; // 序列号，用于客户端预测
}

export interface PingMessage {
  type: 'ping';
  timestamp: number;
}

export type ClientMessage = InputMessage | PingMessage;

// 服务器 -> 客户端 消息
export interface HitMessage {
  type: 'hit';
  attackerId: string;
  targetId: string;
  damage: number;
  targetHp: number;
}

export interface KillMessage {
  type: 'kill';
  killerId: string;
  victimId: string;
  killerKills: number;
}

export interface ZoneMessage {
  type: 'zone';
  phase: number;
  x: number;
  y: number;
  radius: number;
  nextX: number;
  nextY: number;
  nextRadius: number;
}

export interface PongMessage {
  type: 'pong';
  timestamp: number;
  serverTime: number;
}

export interface GameStartMessage {
  type: 'gameStart';
  spawnPoints: Array<{ id: string; x: number; y: number }>;
}

export interface GameEndMessage {
  type: 'gameEnd';
  rankings: Array<{
    id: string;
    name: string;
    rank: number;
    kills: number;
    damage: number;
  }>;
}

export type ServerMessage =
  | HitMessage
  | KillMessage
  | ZoneMessage
  | PongMessage
  | GameStartMessage
  | GameEndMessage;
```

**Step 5: 创建入口文件 shared/src/index.ts**

```typescript
export * from './constants';
export * from './types';
export * from './messages';
```

**Step 6: 验证 TypeScript 编译**

Run: `cd shared && npx tsc --noEmit`
Expected: 无错误输出

**Step 7: 提交**

```bash
git add -A
git commit -m "feat(shared): add game constants, types and message definitions

- Define game configuration constants (map, players, weapons, characters)
- Create TypeScript interfaces for game state
- Define client-server message protocol"
```

---

### Task 1.3: 配置 Client - Vite + Phaser 基础设置

**Files:**
- Create: `client/tsconfig.json`
- Create: `client/vite.config.ts`
- Create: `client/index.html`
- Create: `client/src/main.ts`
- Create: `client/src/config.ts`

**Step 1: 创建 client/tsconfig.json**

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"]
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared" }
  ]
}
```

**Step 2: 创建 client/vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

**Step 3: 创建 client/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Pixel Arena - 像素竞技场</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #1a1a2e;
    }
    #game-container {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    canvas {
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**Step 4: 创建游戏配置 client/src/config.ts**

```typescript
import Phaser from 'phaser';
import { GAME_CONFIG } from '@shared/constants';

export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: import.meta.env.DEV,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 3, // 支持多点触控
  },
};

export const gameSettings = {
  serverUrl: import.meta.env.VITE_SERVER_URL || 'ws://localhost:2567',
  ...GAME_CONFIG,
};
```

**Step 5: 创建入口文件 client/src/main.ts**

```typescript
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
```

**Step 6: 验证客户端启动**

Run: `npm run dev:client`
Expected: 浏览器打开 http://localhost:3000，显示 "Pixel Arena 像素竞技场" 文字

**Step 7: 提交**

```bash
git add -A
git commit -m "feat(client): set up Vite + Phaser 3 configuration

- Configure Vite with alias support
- Create game config with Phaser settings
- Add test scene to verify setup works"
```

---

### Task 1.4: 配置 Server - Colyseus 基础设置

**Files:**
- Create: `server/tsconfig.json`
- Create: `server/src/index.ts`
- Create: `server/src/config.ts`

**Step 1: 创建 server/tsconfig.json**

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared" }
  ]
}
```

**Step 2: 创建服务器配置 server/src/config.ts**

```typescript
import { GAME_CONFIG } from '@pixel-arena/shared';

export const serverConfig = {
  port: Number(process.env.PORT) || 2567,
  ...GAME_CONFIG,
};
```

**Step 3: 创建服务器入口 server/src/index.ts**

```typescript
import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import express from 'express';
import { createServer } from 'http';
import { serverConfig } from './config';

const app = express();

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const httpServer = createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({
    server: httpServer,
  }),
});

// 暂时不注册房间，后续添加

gameServer.listen(serverConfig.port).then(() => {
  console.log(`🎮 Pixel Arena Server`);
  console.log(`🚀 Listening on port ${serverConfig.port}`);
  console.log(`📡 WebSocket ready for connections`);
});
```

**Step 4: 验证服务器启动**

Run: `npm run dev:server`
Expected: 控制台显示 "Listening on port 2567"

**Step 5: 测试健康检查**

Run: `curl http://localhost:2567/health`
Expected: `{"status":"ok","timestamp":...}`

**Step 6: 提交**

```bash
git add -A
git commit -m "feat(server): set up Colyseus server with Express

- Configure Colyseus with WebSocket transport
- Add health check endpoint
- Server listens on port 2567"
```

---

### Task 1.5: 创建 Boot 场景 - 资源预加载

**Files:**
- Create: `client/src/scenes/BootScene.ts`
- Create: `client/public/assets/` (目录)
- Modify: `client/src/main.ts`

**Step 1: 创建占位符资源**

由于还没有真正的美术资源，先创建简单的占位符。创建目录结构：

```
client/public/assets/
├── sprites/
├── maps/
├── audio/
└── ui/
```

**Step 2: 创建 BootScene client/src/scenes/BootScene.ts**

```typescript
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.createLoadingUI();

    // 加载进度事件
    this.load.on('progress', (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0x00ff00, 1);
      this.progressBar.fillRect(252, 282, 300 * value, 30);
      this.loadingText.setText(`加载中... ${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      this.progressBar.destroy();
      this.progressBox.destroy();
      this.loadingText.destroy();
    });

    // 生成占位符精灵图
    this.createPlaceholderAssets();
  }

  create() {
    // 资源加载完成，切换到菜单场景
    this.scene.start('MenuScene');
  }

  private createLoadingUI() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 进度条背景
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(240, 270, 320, 50);

    // 进度条
    this.progressBar = this.add.graphics();

    // 加载文字
    this.loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {
      fontSize: '24px',
      color: '#ffffff',
    });
    this.loadingText.setOrigin(0.5);

    // 标题
    const title = this.add.text(width / 2, 150, 'PIXEL ARENA', {
      fontSize: '64px',
      color: '#00ff00',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
  }

  private createPlaceholderAssets() {
    // 生成玩家精灵占位符 (32x32 彩色方块)
    const playerColors = {
      assault: 0x00ff00,
      tank: 0x0000ff,
      ranger: 0xff00ff,
      medic: 0x00ffff,
    };

    Object.entries(playerColors).forEach(([name, color]) => {
      const graphics = this.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, 0, 32, 32);
      graphics.generateTexture(`player_${name}`, 32, 32);
      graphics.destroy();
    });

    // 生成子弹占位符 (8x8 黄色方块)
    const bulletGraphics = this.make.graphics({ x: 0, y: 0 });
    bulletGraphics.fillStyle(0xffff00, 1);
    bulletGraphics.fillRect(0, 0, 8, 8);
    bulletGraphics.generateTexture('bullet', 8, 8);
    bulletGraphics.destroy();

    // 生成道具占位符 (24x24 白色方块)
    const itemGraphics = this.make.graphics({ x: 0, y: 0 });
    itemGraphics.fillStyle(0xffffff, 1);
    itemGraphics.fillRect(0, 0, 24, 24);
    itemGraphics.generateTexture('item', 24, 24);
    itemGraphics.destroy();

    // 生成地图瓦片占位符
    const tileColors = {
      ground: 0x3d3d3d,
      wall: 0x666666,
      water: 0x4444ff,
      grass: 0x228b22,
      lava: 0xff4500,
    };

    Object.entries(tileColors).forEach(([name, color]) => {
      const graphics = this.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, 0, 32, 32);
      graphics.generateTexture(`tile_${name}`, 32, 32);
      graphics.destroy();
    });
  }
}
```

**Step 3: 创建空的 MenuScene 占位符 client/src/scenes/MenuScene.ts**

```typescript
import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 标题
    const title = this.add.text(width / 2, 100, 'PIXEL ARENA', {
      fontSize: '48px',
      color: '#00ff00',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // 开始按钮
    const startButton = this.add.text(width / 2, height / 2, '[ 开始游戏 ]', {
      fontSize: '32px',
      color: '#ffffff',
    });
    startButton.setOrigin(0.5);
    startButton.setInteractive({ useHandCursor: true });

    startButton.on('pointerover', () => {
      startButton.setColor('#00ff00');
    });

    startButton.on('pointerout', () => {
      startButton.setColor('#ffffff');
    });

    startButton.on('pointerdown', () => {
      // TODO: 切换到游戏场景
      console.log('开始游戏');
    });

    // 版本号
    this.add.text(10, height - 30, 'v0.1.0', {
      fontSize: '16px',
      color: '#666666',
    });
  }
}
```

**Step 4: 更新 main.ts 使用新场景**

```typescript
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
```

**Step 5: 创建资源目录**

Run: `mkdir -p client/public/assets/{sprites,maps,audio,ui}`

**Step 6: 验证场景切换**

Run: `npm run dev:client`
Expected: 显示加载进度条，然后切换到菜单界面，显示 "PIXEL ARENA" 和 "开始游戏" 按钮

**Step 7: 提交**

```bash
git add -A
git commit -m "feat(client): add BootScene with loading UI and placeholder assets

- Create BootScene with progress bar
- Generate placeholder sprites for players, bullets, items, tiles
- Add MenuScene with start button
- Set up scene flow: Boot -> Menu"
```

---

### Task 1.6: 创建 Game 场景 - 基础地图渲染

**Files:**
- Create: `client/src/scenes/GameScene.ts`
- Modify: `client/src/scenes/MenuScene.ts`
- Modify: `client/src/main.ts`

**Step 1: 创建 GameScene client/src/scenes/GameScene.ts**

```typescript
import Phaser from 'phaser';
import { GAME_CONFIG } from '@shared/constants';

export class GameScene extends Phaser.Scene {
  private map!: Phaser.Tilemaps.Tilemap;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // 创建简单的地图
    this.createMap();

    // 设置相机边界
    this.cameras.main.setBounds(0, 0, GAME_CONFIG.MAP_WIDTH, GAME_CONFIG.MAP_HEIGHT);

    // 启用键盘输入
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    }

    // 添加调试文字
    const debugText = this.add.text(10, 10, '游戏场景 - 使用方向键移动相机', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
    });
    debugText.setScrollFactor(0); // 固定在屏幕上

    // ESC 返回菜单
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  }

  update() {
    // 使用方向键移动相机（临时测试用）
    const cameraSpeed = 10;

    if (this.cursors.left.isDown) {
      this.cameras.main.scrollX -= cameraSpeed;
    }
    if (this.cursors.right.isDown) {
      this.cameras.main.scrollX += cameraSpeed;
    }
    if (this.cursors.up.isDown) {
      this.cameras.main.scrollY -= cameraSpeed;
    }
    if (this.cursors.down.isDown) {
      this.cameras.main.scrollY += cameraSpeed;
    }
  }

  private createMap() {
    const tileSize = GAME_CONFIG.TILE_SIZE;
    const mapWidth = GAME_CONFIG.MAP_WIDTH / tileSize;
    const mapHeight = GAME_CONFIG.MAP_HEIGHT / tileSize;

    // 绘制地面
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        this.add.image(
          x * tileSize + tileSize / 2,
          y * tileSize + tileSize / 2,
          'tile_ground'
        );
      }
    }

    // 绘制边界墙
    for (let x = 0; x < mapWidth; x++) {
      this.add.image(x * tileSize + tileSize / 2, tileSize / 2, 'tile_wall');
      this.add.image(
        x * tileSize + tileSize / 2,
        (mapHeight - 1) * tileSize + tileSize / 2,
        'tile_wall'
      );
    }
    for (let y = 0; y < mapHeight; y++) {
      this.add.image(tileSize / 2, y * tileSize + tileSize / 2, 'tile_wall');
      this.add.image(
        (mapWidth - 1) * tileSize + tileSize / 2,
        y * tileSize + tileSize / 2,
        'tile_wall'
      );
    }

    // 添加一些随机障碍物
    const obstacleCount = 20;
    for (let i = 0; i < obstacleCount; i++) {
      const x = Phaser.Math.Between(2, mapWidth - 3);
      const y = Phaser.Math.Between(2, mapHeight - 3);
      this.add.image(
        x * tileSize + tileSize / 2,
        y * tileSize + tileSize / 2,
        'tile_wall'
      );
    }

    // 添加一些水域
    const waterX = Phaser.Math.Between(5, 15);
    const waterY = Phaser.Math.Between(5, 15);
    for (let dx = 0; dx < 5; dx++) {
      for (let dy = 0; dy < 3; dy++) {
        this.add.image(
          (waterX + dx) * tileSize + tileSize / 2,
          (waterY + dy) * tileSize + tileSize / 2,
          'tile_water'
        );
      }
    }

    // 添加一些草丛
    const grassX = Phaser.Math.Between(25, 35);
    const grassY = Phaser.Math.Between(10, 20);
    for (let dx = 0; dx < 6; dx++) {
      for (let dy = 0; dy < 4; dy++) {
        this.add.image(
          (grassX + dx) * tileSize + tileSize / 2,
          (grassY + dy) * tileSize + tileSize / 2,
          'tile_grass'
        );
      }
    }
  }
}
```

**Step 2: 更新 MenuScene 添加场景切换**

修改 `client/src/scenes/MenuScene.ts`，在 `pointerdown` 事件中：

```typescript
startButton.on('pointerdown', () => {
  this.scene.start('GameScene');
});
```

**Step 3: 更新 main.ts 添加 GameScene**

```typescript
import Phaser from 'phaser';
import { phaserConfig } from './config';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  ...phaserConfig,
  scene: [BootScene, MenuScene, GameScene],
};

// 启动游戏
const game = new Phaser.Game(config);

// 热更新支持
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.destroy(true);
  });
}
```

**Step 4: 验证地图渲染**

Run: `npm run dev:client`
Expected: 点击 "开始游戏" 后显示地图，可以用方向键移动相机，ESC 返回菜单

**Step 5: 提交**

```bash
git add -A
git commit -m "feat(client): add GameScene with basic map rendering

- Create procedural map with ground, walls, water, grass
- Add camera controls with arrow keys
- ESC key returns to menu
- Map size: 1600x1200 pixels"
```

---

### Task 1.7: 创建 Player 实体 - 本地移动控制

**Files:**
- Create: `client/src/entities/Player.ts`
- Modify: `client/src/scenes/GameScene.ts`

**Step 1: 创建 Player 类 client/src/entities/Player.ts**

```typescript
import Phaser from 'phaser';
import { GAME_CONFIG, CHARACTERS } from '@shared/constants';
import { CharacterType, PlayerInput } from '@shared/types';

export class Player extends Phaser.GameObjects.Container {
  public readonly playerId: string;
  public readonly characterType: CharacterType;
  public isLocalPlayer: boolean;

  private sprite: Phaser.GameObjects.Image;
  private nameText: Phaser.GameObjects.Text;
  private body!: Phaser.Physics.Arcade.Body;

  private characterConfig: typeof CHARACTERS[CharacterType];
  private moveSpeed: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    playerId: string,
    name: string,
    characterType: CharacterType,
    isLocalPlayer: boolean = false
  ) {
    super(scene, x, y);

    this.playerId = playerId;
    this.characterType = characterType;
    this.isLocalPlayer = isLocalPlayer;
    this.characterConfig = CHARACTERS[characterType];
    this.moveSpeed = GAME_CONFIG.PLAYER_SPEED * this.characterConfig.speedModifier;

    // 创建玩家精灵
    this.sprite = scene.add.image(0, 0, `player_${characterType}`);
    this.add(this.sprite);

    // 创建名字标签
    this.nameText = scene.add.text(0, -24, name, {
      fontSize: '12px',
      color: isLocalPlayer ? '#00ff00' : '#ffffff',
      align: 'center',
    });
    this.nameText.setOrigin(0.5);
    this.add(this.nameText);

    // 添加到场景
    scene.add.existing(this);

    // 启用物理
    scene.physics.add.existing(this);
    this.body = this.body as Phaser.Physics.Arcade.Body;
    this.body.setCollideWorldBounds(true);
    this.body.setSize(GAME_CONFIG.PLAYER_SIZE, GAME_CONFIG.PLAYER_SIZE);
  }

  update(input: PlayerInput) {
    if (!this.isLocalPlayer) return;

    // 移动
    const velocityX = input.dx * this.moveSpeed;
    const velocityY = input.dy * this.moveSpeed;
    this.body.setVelocity(velocityX, velocityY);

    // 朝向
    this.sprite.setRotation(input.angle);
  }

  // 用于网络同步：设置目标位置
  setTargetPosition(x: number, y: number, angle: number) {
    if (this.isLocalPlayer) return;

    // 简单插值移动（后续会改进）
    this.setPosition(x, y);
    this.sprite.setRotation(angle);
  }

  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }
}
```

**Step 2: 创建输入管理器 client/src/input/InputManager.ts**

```typescript
import Phaser from 'phaser';
import { PlayerInput } from '@shared/types';

export class InputManager {
  private scene: Phaser.Scene;
  private keys: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    Q: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
  } | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    if (scene.input.keyboard) {
      this.keys = {
        W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        Q: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
        E: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
        SPACE: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      };
    }
  }

  getInput(): PlayerInput {
    let dx = 0;
    let dy = 0;

    if (this.keys) {
      if (this.keys.A.isDown) dx -= 1;
      if (this.keys.D.isDown) dx += 1;
      if (this.keys.W.isDown) dy -= 1;
      if (this.keys.S.isDown) dy += 1;
    }

    // 归一化对角移动
    if (dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;
    }

    // 计算鼠标朝向角度
    const pointer = this.scene.input.activePointer;
    const camera = this.scene.cameras.main;
    const worldX = pointer.x + camera.scrollX;
    const worldY = pointer.y + camera.scrollY;

    // 获取玩家位置（需要从场景获取）
    const playerPos = this.getPlayerPosition();
    const angle = Phaser.Math.Angle.Between(playerPos.x, playerPos.y, worldX, worldY);

    // 检测射击（鼠标左键或空格）
    const shooting = pointer.isDown || (this.keys?.SPACE.isDown ?? false);

    // 检测技能
    const skill = this.keys?.Q.isDown ?? false;

    return {
      dx,
      dy,
      angle,
      shooting,
      skill,
    };
  }

  private getPlayerPosition(): { x: number; y: number } {
    // 这是个临时方案，实际应该从 GameScene 获取
    const gameScene = this.scene as any;
    if (gameScene.localPlayer) {
      return gameScene.localPlayer.getPosition();
    }
    return { x: 400, y: 300 };
  }
}
```

**Step 3: 更新 GameScene 添加玩家**

修改 `client/src/scenes/GameScene.ts`：

```typescript
import Phaser from 'phaser';
import { GAME_CONFIG } from '@shared/constants';
import { Player } from '../entities/Player';
import { InputManager } from '../input/InputManager';

export class GameScene extends Phaser.Scene {
  public localPlayer!: Player;
  private inputManager!: InputManager;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // 设置世界边界
    this.physics.world.setBounds(0, 0, GAME_CONFIG.MAP_WIDTH, GAME_CONFIG.MAP_HEIGHT);

    // 创建地图
    this.createMap();

    // 创建本地玩家
    this.localPlayer = new Player(
      this,
      GAME_CONFIG.MAP_WIDTH / 2,
      GAME_CONFIG.MAP_HEIGHT / 2,
      'local-player',
      'Player',
      'assault',
      true
    );

    // 设置相机跟随玩家
    this.cameras.main.setBounds(0, 0, GAME_CONFIG.MAP_WIDTH, GAME_CONFIG.MAP_HEIGHT);
    this.cameras.main.startFollow(this.localPlayer, true, 0.1, 0.1);

    // 初始化输入管理器
    this.inputManager = new InputManager(this);

    // 添加调试文字
    const debugText = this.add.text(10, 10, 'WASD 移动 | 鼠标瞄准 | ESC 返回', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
    });
    debugText.setScrollFactor(0);

    // ESC 返回菜单
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  }

  update(time: number, delta: number) {
    // 获取输入并更新玩家
    const input = this.inputManager.getInput();
    this.localPlayer.update(input);
  }

  private createMap() {
    const tileSize = GAME_CONFIG.TILE_SIZE;
    const mapWidth = GAME_CONFIG.MAP_WIDTH / tileSize;
    const mapHeight = GAME_CONFIG.MAP_HEIGHT / tileSize;

    // 绘制地面
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        this.add.image(
          x * tileSize + tileSize / 2,
          y * tileSize + tileSize / 2,
          'tile_ground'
        );
      }
    }

    // 绘制边界墙
    for (let x = 0; x < mapWidth; x++) {
      this.add.image(x * tileSize + tileSize / 2, tileSize / 2, 'tile_wall');
      this.add.image(
        x * tileSize + tileSize / 2,
        (mapHeight - 1) * tileSize + tileSize / 2,
        'tile_wall'
      );
    }
    for (let y = 0; y < mapHeight; y++) {
      this.add.image(tileSize / 2, y * tileSize + tileSize / 2, 'tile_wall');
      this.add.image(
        (mapWidth - 1) * tileSize + tileSize / 2,
        y * tileSize + tileSize / 2,
        'tile_wall'
      );
    }

    // 添加一些随机障碍物
    const obstacleCount = 30;
    for (let i = 0; i < obstacleCount; i++) {
      const x = Phaser.Math.Between(2, mapWidth - 3);
      const y = Phaser.Math.Between(2, mapHeight - 3);
      this.add.image(
        x * tileSize + tileSize / 2,
        y * tileSize + tileSize / 2,
        'tile_wall'
      );
    }

    // 水域
    for (let dx = 0; dx < 5; dx++) {
      for (let dy = 0; dy < 3; dy++) {
        this.add.image(
          (5 + dx) * tileSize + tileSize / 2,
          (5 + dy) * tileSize + tileSize / 2,
          'tile_water'
        );
      }
    }

    // 草丛
    for (let dx = 0; dx < 6; dx++) {
      for (let dy = 0; dy < 4; dy++) {
        this.add.image(
          (30 + dx) * tileSize + tileSize / 2,
          (15 + dy) * tileSize + tileSize / 2,
          'tile_grass'
        );
      }
    }
  }
}
```

**Step 4: 创建输入目录**

Run: `mkdir -p client/src/input`

**Step 5: 验证玩家移动**

Run: `npm run dev:client`
Expected:
- WASD 控制玩家移动
- 鼠标控制玩家朝向
- 相机跟随玩家
- ESC 返回菜单

**Step 6: 提交**

```bash
git add -A
git commit -m "feat(client): add Player entity with local movement controls

- Create Player class with physics body
- Add InputManager for keyboard/mouse input
- WASD movement, mouse aiming
- Camera follows local player
- Normalize diagonal movement speed"
```

---

### Task 1.8: 阶段 1 完成验证

**验证清单：**

1. ✅ Monorepo 结构建立 (client/server/shared)
2. ✅ 共享类型和常量定义
3. ✅ Vite + Phaser 客户端配置
4. ✅ Colyseus 服务器基础配置
5. ✅ Boot 场景（资源加载）
6. ✅ Menu 场景（主菜单）
7. ✅ Game 场景（地图渲染）
8. ✅ Player 实体（本地移动控制）

**验证步骤：**

Run: `npm run dev`
Expected: 服务器和客户端同时启动，可以正常进入游戏，使用 WASD 移动角色

**阶段 1 里程碑达成：** 单机可以在地图上移动的角色 ✅

---

## 阶段 2：核心玩法（单机）

> 后续任务将在阶段 1 完成后继续添加...

### Task 2.1: 子弹系统 - 发射与碰撞

**Files:**
- Create: `client/src/entities/Bullet.ts`
- Modify: `client/src/scenes/GameScene.ts`
- Modify: `client/src/entities/Player.ts`

*(详细步骤将在阶段 1 完成后编写)*

### Task 2.2: 武器系统 - 4 种武器实现

### Task 2.3: 道具系统 - 刷新与拾取

### Task 2.4: 角色技能系统

### Task 2.5: 伤害与死亡系统

### Task 2.6: 缩圈机制

---

## 阶段 3：多人联机

*(将在阶段 2 完成后编写)*

---

## 阶段 4：完善打磨

*(将在阶段 3 完成后编写)*

---

## 阶段 5：部署上线

*(将在阶段 4 完成后编写)*
