# Pixel Arena 像素风格重构实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 Pixel Arena 游戏从简单几何图形升级为完整的现代像素风格，包括修复拾取系统、重设计 UI、替换角色道具精灵、优化地图瓦片。

**Architecture:** 采用程序化像素图形生成（无需外部素材文件），使用 Phaser 3 的 Graphics API 绘制像素风格元素。UI 组件模块化重构，地图使用 Tilemap 系统。

**Tech Stack:** Phaser 3, TypeScript, Canvas Graphics API, Google Fonts (Press Start 2P)

---

## Phase 0: 拾取系统修复 (P0)

### Task 0.1: 修复拾取半径

**Files:**
- Modify: `server/src/rooms/GameRoom.ts:611`

**Step 1: 修改拾取半径**

将 `pickupRadius` 从 30 改为 50：

```typescript
const pickupRadius = 50; // Pickup range (was 30)
```

**Step 2: 验证修改**

Run: `grep -n "pickupRadius" server/src/rooms/GameRoom.ts`
Expected: 显示 `pickupRadius = 50`

**Step 3: 提交**

```bash
git add server/src/rooms/GameRoom.ts
git commit -m "fix: increase pickup radius from 30 to 50 pixels"
```

---

### Task 0.2: 添加道具悬浮动画

**Files:**
- Modify: `client/src/entities/Item.ts`

**Step 1: 添加悬浮动画属性和方法**

在 Item 类中添加：

```typescript
private floatTween: Phaser.Tweens.Tween | null = null;
private glowGraphics: Phaser.GameObjects.Graphics | null = null;

startFloatAnimation() {
  if (this.floatTween) return;

  const startY = this.sprite.y;
  this.floatTween = this.scene.tweens.add({
    targets: this.sprite,
    y: startY - 5,
    duration: 500,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}

stopFloatAnimation() {
  if (this.floatTween) {
    this.floatTween.stop();
    this.floatTween = null;
  }
}

showGlow(color: number = 0xffff00) {
  if (this.glowGraphics) return;

  this.glowGraphics = this.scene.add.graphics();
  this.glowGraphics.setDepth(this.sprite.depth - 1);

  // 像素风格发光效果
  this.glowGraphics.fillStyle(color, 0.3);
  this.glowGraphics.fillRect(
    this.sprite.x - 12,
    this.sprite.y - 12,
    24,
    24
  );
}

hideGlow() {
  if (this.glowGraphics) {
    this.glowGraphics.destroy();
    this.glowGraphics = null;
  }
}

updateGlowPosition() {
  if (this.glowGraphics) {
    this.glowGraphics.clear();
    this.glowGraphics.fillStyle(0xffff00, 0.3);
    this.glowGraphics.fillRect(
      this.sprite.x - 12,
      this.sprite.y - 12,
      24,
      24
    );
  }
}
```

**Step 2: 启动悬浮动画**

在 Item 构造函数末尾添加：

```typescript
this.startFloatAnimation();
```

**Step 3: 验证编译**

Run: `cd client && npx tsc --noEmit 2>&1 | head -20`
Expected: 无新增错误

**Step 4: 提交**

```bash
git add client/src/entities/Item.ts
git commit -m "feat: add floating animation and glow effect to items"
```

---

### Task 0.3: 添加拾取文字提示

**Files:**
- Create: `client/src/ui/PickupNotification.ts`
- Modify: `client/src/scenes/GameScene.ts`

**Step 1: 创建 PickupNotification 组件**

```typescript
import Phaser from 'phaser';

interface Notification {
  text: Phaser.GameObjects.Text;
  createdAt: number;
}

export class PickupNotification {
  private scene: Phaser.Scene;
  private notifications: Notification[] = [];
  private readonly duration: number = 1500;
  private readonly startY: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.startY = 120;
  }

  show(itemName: string, itemType: 'weapon' | 'skill') {
    const { width } = this.scene.cameras.main;
    const color = itemType === 'weapon' ? '#FFC107' : '#7C4DFF';
    const prefix = itemType === 'weapon' ? '🔫' : '⚡';

    const text = this.scene.add.text(width / 2, this.startY, `${prefix} +${itemName}`, {
      fontSize: '16px',
      fontFamily: '"Press Start 2P", monospace',
      color: color,
      stroke: '#000000',
      strokeThickness: 3,
    });
    text.setOrigin(0.5);
    text.setScrollFactor(0);
    text.setDepth(1200);
    text.setAlpha(0);

    // 淡入 + 上浮动画
    this.scene.tweens.add({
      targets: text,
      alpha: 1,
      y: this.startY - 20,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        // 停留后淡出
        this.scene.time.delayedCall(this.duration - 400, () => {
          this.scene.tweens.add({
            targets: text,
            alpha: 0,
            y: this.startY - 40,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
              text.destroy();
            },
          });
        });
      },
    });

    this.notifications.push({ text, createdAt: Date.now() });
  }

  destroy() {
    this.notifications.forEach(n => n.text.destroy());
    this.notifications = [];
  }
}
```

**Step 2: 集成到 GameScene**

在 GameScene.ts 中添加：

```typescript
import { PickupNotification } from '../ui/PickupNotification';

// 添加属性
private pickupNotification!: PickupNotification;

// 在 create() 中初始化
this.pickupNotification = new PickupNotification(this);

// 在 setupNetworkListeners() 中监听拾取
networkManager.on('pickup', (data: any) => {
  if (data.playerId === networkManager.getSessionId()) {
    const itemName = this.getItemDisplayName(data.subType);
    this.pickupNotification.show(itemName, data.itemType);
  }
});

// 添加辅助方法
private getItemDisplayName(subType: string): string {
  const names: Record<string, string> = {
    pistol: '手枪',
    smg: '冲锋枪',
    rifle: '步枪',
    shotgun: '霰弹枪',
    dash: '冲刺',
    shield: '护盾',
    backflip: '后空翻',
    healAura: '治疗光环',
  };
  return names[subType] || subType;
}
```

**Step 3: 验证编译**

Run: `cd client && npx tsc --noEmit 2>&1 | head -20`

**Step 4: 提交**

```bash
git add client/src/ui/PickupNotification.ts client/src/scenes/GameScene.ts
git commit -m "feat: add pickup notification with floating text"
```

---

## Phase 1: UI 界面像素化 (P1)

### Task 1.1: 添加像素字体

**Files:**
- Modify: `client/index.html`

**Step 1: 添加 Google Fonts 像素字体**

在 `<head>` 中添加：

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet">
```

**Step 2: 验证**

Run: `grep "Press Start" client/index.html`
Expected: 显示字体链接

**Step 3: 提交**

```bash
git add client/index.html
git commit -m "feat: add pixel fonts (Press Start 2P, VT323)"
```

---

### Task 1.2: 创建像素风格 UI 工具类

**Files:**
- Create: `client/src/ui/PixelUI.ts`

**Step 1: 创建 PixelUI 工具类**

```typescript
import Phaser from 'phaser';

export const PIXEL_COLORS = {
  // 血条
  HP_FILL: 0xE53935,
  HP_BG: 0xB71C1C,
  // 弹药
  AMMO_FILL: 0xFFC107,
  AMMO_BG: 0xFF8F00,
  // 技能
  SKILL_FILL: 0x7C4DFF,
  SKILL_BG: 0x4A148C,
  // 通用
  BORDER: 0x000000,
  PANEL_BG: 0x1a1a2e,
  TEXT_WHITE: '#FFFFFF',
  TEXT_GOLD: '#FFC107',
};

export const PIXEL_FONTS = {
  TITLE: '"Press Start 2P", monospace',
  TEXT: '"VT323", monospace',
};

export class PixelUI {
  /**
   * 绘制像素风格边框
   */
  static drawPixelBorder(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    borderWidth: number = 2,
    borderColor: number = PIXEL_COLORS.BORDER,
    fillColor?: number,
    fillAlpha: number = 1
  ) {
    // 填充背景
    if (fillColor !== undefined) {
      graphics.fillStyle(fillColor, fillAlpha);
      graphics.fillRect(x, y, width, height);
    }

    // 像素边框（四条线）
    graphics.fillStyle(borderColor, 1);
    // 上边
    graphics.fillRect(x, y, width, borderWidth);
    // 下边
    graphics.fillRect(x, y + height - borderWidth, width, borderWidth);
    // 左边
    graphics.fillRect(x, y, borderWidth, height);
    // 右边
    graphics.fillRect(x + width - borderWidth, y, borderWidth, height);
  }

  /**
   * 绘制像素进度条
   */
  static drawPixelProgressBar(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    progress: number, // 0-1
    fillColor: number,
    bgColor: number,
    borderColor: number = PIXEL_COLORS.BORDER
  ) {
    const borderWidth = 2;
    const innerWidth = width - borderWidth * 2;
    const innerHeight = height - borderWidth * 2;
    const fillWidth = Math.floor(innerWidth * Math.max(0, Math.min(1, progress)));

    // 背景
    graphics.fillStyle(bgColor, 1);
    graphics.fillRect(x + borderWidth, y + borderWidth, innerWidth, innerHeight);

    // 填充
    if (fillWidth > 0) {
      graphics.fillStyle(fillColor, 1);
      graphics.fillRect(x + borderWidth, y + borderWidth, fillWidth, innerHeight);
    }

    // 边框
    this.drawPixelBorder(graphics, x, y, width, height, borderWidth, borderColor);
  }

  /**
   * 创建像素风格文本
   */
  static createPixelText(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    size: number = 12,
    color: string = PIXEL_COLORS.TEXT_WHITE
  ): Phaser.GameObjects.Text {
    return scene.add.text(x, y, text, {
      fontSize: `${size}px`,
      fontFamily: PIXEL_FONTS.TITLE,
      color: color,
      stroke: '#000000',
      strokeThickness: 2,
    });
  }
}
```

**Step 2: 验证编译**

Run: `cd client && npx tsc --noEmit 2>&1 | head -10`

**Step 3: 提交**

```bash
git add client/src/ui/PixelUI.ts
git commit -m "feat: create PixelUI utility class with colors and helpers"
```

---

### Task 1.3: 重设计血条组件

**Files:**
- Modify: `client/src/ui/HealthBar.ts`

**Step 1: 重写 HealthBar 为像素风格**

```typescript
import Phaser from 'phaser';
import { PixelUI, PIXEL_COLORS, PIXEL_FONTS } from './PixelUI';

export class HealthBar {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private graphics: Phaser.GameObjects.Graphics;
  private hpText: Phaser.GameObjects.Text;
  private heartIcon: Phaser.GameObjects.Text;

  private currentHp: number = 100;
  private maxHp: number = 100;

  private readonly x: number = 10;
  private readonly y: number = 50;
  private readonly width: number = 180;
  private readonly height: number = 24;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.container = scene.add.container(this.x, this.y);
    this.container.setScrollFactor(0);
    this.container.setDepth(1000);

    // 图形层
    this.graphics = scene.add.graphics();
    this.container.add(this.graphics);

    // 心形图标
    this.heartIcon = scene.add.text(4, 4, '❤', {
      fontSize: '14px',
    });
    this.container.add(this.heartIcon);

    // HP 数值
    this.hpText = scene.add.text(this.width - 8, this.height / 2, '100', {
      fontSize: '14px',
      fontFamily: PIXEL_FONTS.TEXT,
      color: PIXEL_COLORS.TEXT_WHITE,
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.hpText.setOrigin(1, 0.5);
    this.container.add(this.hpText);

    this.render();
  }

  update(currentHp: number, maxHp: number) {
    this.currentHp = currentHp;
    this.maxHp = maxHp;
    this.render();
  }

  private render() {
    this.graphics.clear();

    const progress = this.maxHp > 0 ? this.currentHp / this.maxHp : 0;
    const barX = 22;
    const barWidth = this.width - 50;

    // 绘制像素进度条
    PixelUI.drawPixelProgressBar(
      this.graphics,
      barX,
      2,
      barWidth,
      this.height - 4,
      progress,
      PIXEL_COLORS.HP_FILL,
      PIXEL_COLORS.HP_BG
    );

    // 更新文本
    this.hpText.setText(`${Math.ceil(this.currentHp)}`);

    // 低血量闪烁
    if (progress < 0.3) {
      this.heartIcon.setAlpha(0.5 + Math.sin(Date.now() / 100) * 0.5);
    } else {
      this.heartIcon.setAlpha(1);
    }
  }

  destroy() {
    this.container.destroy();
  }
}
```

**Step 2: 验证编译**

Run: `cd client && npx tsc --noEmit 2>&1 | head -10`

**Step 3: 提交**

```bash
git add client/src/ui/HealthBar.ts
git commit -m "feat: redesign health bar with pixel style"
```

---

### Task 1.4: 创建像素风格弹药框

**Files:**
- Create: `client/src/ui/AmmoBox.ts`
- Modify: `client/src/scenes/GameScene.ts`

**Step 1: 创建 AmmoBox 组件**

```typescript
import Phaser from 'phaser';
import { PixelUI, PIXEL_COLORS, PIXEL_FONTS } from './PixelUI';

const WEAPON_ICONS: Record<string, string> = {
  pistol: '🔫',
  smg: '🔫',
  rifle: '🎯',
  shotgun: '💥',
};

const WEAPON_NAMES: Record<string, string> = {
  pistol: '手枪',
  smg: '冲锋枪',
  rifle: '步枪',
  shotgun: '霰弹枪',
};

export class AmmoBox {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private graphics: Phaser.GameObjects.Graphics;
  private weaponIcon: Phaser.GameObjects.Text;
  private weaponName: Phaser.GameObjects.Text;
  private ammoText: Phaser.GameObjects.Text;

  private currentAmmo: number = 30;
  private maxAmmo: number = 30;
  private currentWeapon: string = 'pistol';

  private readonly width: number = 140;
  private readonly height: number = 70;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const x = scene.cameras.main.width - this.width - 10;
    const y = scene.cameras.main.height - this.height - 10;

    this.container = scene.add.container(x, y);
    this.container.setScrollFactor(0);
    this.container.setDepth(1000);

    // 图形层
    this.graphics = scene.add.graphics();
    this.container.add(this.graphics);

    // 武器图标
    this.weaponIcon = scene.add.text(10, 8, '🔫', {
      fontSize: '20px',
    });
    this.container.add(this.weaponIcon);

    // 武器名称
    this.weaponName = scene.add.text(38, 10, '手枪', {
      fontSize: '12px',
      fontFamily: PIXEL_FONTS.TITLE,
      color: PIXEL_COLORS.TEXT_WHITE,
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.container.add(this.weaponName);

    // 弹药数
    this.ammoText = scene.add.text(this.width / 2, 42, '30 / 30', {
      fontSize: '18px',
      fontFamily: PIXEL_FONTS.TEXT,
      color: PIXEL_COLORS.TEXT_GOLD,
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.ammoText.setOrigin(0.5, 0);
    this.container.add(this.ammoText);

    this.render();
  }

  update(weapon: string, currentAmmo: number, maxAmmo: number) {
    this.currentWeapon = weapon;
    this.currentAmmo = currentAmmo;
    this.maxAmmo = maxAmmo;
    this.render();
  }

  private render() {
    this.graphics.clear();

    // 背景面板
    PixelUI.drawPixelBorder(
      this.graphics,
      0,
      0,
      this.width,
      this.height,
      2,
      PIXEL_COLORS.BORDER,
      PIXEL_COLORS.PANEL_BG,
      0.8
    );

    // 弹药进度条
    const progress = this.maxAmmo > 0 ? this.currentAmmo / this.maxAmmo : 0;
    PixelUI.drawPixelProgressBar(
      this.graphics,
      8,
      this.height - 16,
      this.width - 16,
      10,
      progress,
      PIXEL_COLORS.AMMO_FILL,
      PIXEL_COLORS.AMMO_BG
    );

    // 更新文本
    this.weaponIcon.setText(WEAPON_ICONS[this.currentWeapon] || '🔫');
    this.weaponName.setText(WEAPON_NAMES[this.currentWeapon] || this.currentWeapon);
    this.ammoText.setText(`${this.currentAmmo} / ${this.maxAmmo}`);

    // 低弹药警告
    if (progress < 0.2) {
      this.ammoText.setColor('#E53935');
    } else {
      this.ammoText.setColor(PIXEL_COLORS.TEXT_GOLD);
    }
  }

  destroy() {
    this.container.destroy();
  }
}
```

**Step 2: 集成到 GameScene**

在 GameScene.ts 添加：

```typescript
import { AmmoBox } from '../ui/AmmoBox';

// 添加属性
private ammoBox!: AmmoBox;

// 在 create() 中初始化
this.ammoBox = new AmmoBox(this);

// 在 update() 中更新
const player = this.state?.players.get(networkManager.getSessionId() || '');
if (player) {
  this.ammoBox.update(player.weapon, player.ammo, this.getMaxAmmo(player.weapon));
}

// 添加辅助方法
private getMaxAmmo(weapon: string): number {
  const maxAmmos: Record<string, number> = {
    pistol: 12,
    smg: 30,
    rifle: 20,
    shotgun: 8,
  };
  return maxAmmos[weapon] || 12;
}
```

**Step 3: 验证编译**

Run: `cd client && npx tsc --noEmit 2>&1 | head -10`

**Step 4: 提交**

```bash
git add client/src/ui/AmmoBox.ts client/src/scenes/GameScene.ts
git commit -m "feat: add pixel-style ammo box UI component"
```

---

### Task 1.5: 重设计小地图为方形像素风格

**Files:**
- Modify: `client/src/ui/Minimap.ts`

**Step 1: 重写 Minimap 为方形像素风格**

修改 Minimap.ts，主要改动：

```typescript
import { PixelUI, PIXEL_COLORS } from './PixelUI';

// 修改构造函数中的边框绘制
private createBackground() {
  // 方形像素边框
  const border = this.scene.add.graphics();
  PixelUI.drawPixelBorder(
    border,
    -2,
    -2,
    this.size + 4,
    this.size + 4,
    2,
    0x8D6E63, // 棕色边框
    0x1a1a2e,
    0.8
  );
  this.container.add(border);
}

// 修改 updateZone 中安全圈绘制为像素虚线风格
private updateZone(zone: MinimapZone) {
  this.graphics.clear();

  // 危险区红色叠加
  this.graphics.fillStyle(0x9C27B0, 0.3);
  this.graphics.fillRect(0, 0, this.size, this.size);

  // 安全区（清除红色）
  const centerX = this.worldToMinimapX(zone.x);
  const centerY = this.worldToMinimapY(zone.y);
  const radius = zone.currentRadius * this.scale;

  this.graphics.fillStyle(0x1a1a2e, 1);
  this.graphics.fillCircle(centerX, centerY, radius);

  // 像素风格边界线（使用小方块模拟）
  this.graphics.fillStyle(0x00aaff, 0.8);
  const segments = 32;
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    this.graphics.fillRect(x - 1, y - 1, 2, 2);
  }
}
```

**Step 2: 验证编译**

Run: `cd client && npx tsc --noEmit 2>&1 | head -10`

**Step 3: 提交**

```bash
git add client/src/ui/Minimap.ts
git commit -m "feat: redesign minimap with pixel square style"
```

---

### Task 1.6: 重设计技能栏

**Files:**
- Create: `client/src/ui/SkillBar.ts`

**Step 1: 创建像素风格技能栏**

```typescript
import Phaser from 'phaser';
import { PixelUI, PIXEL_COLORS, PIXEL_FONTS } from './PixelUI';

const SKILL_ICONS: Record<string, string> = {
  dash: '⚡',
  shield: '🛡',
  backflip: '🔄',
  healAura: '💚',
};

const SKILL_NAMES: Record<string, string> = {
  dash: '冲刺',
  shield: '护盾',
  backflip: '翻滚',
  healAura: '治疗',
};

export class SkillBar {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private graphics: Phaser.GameObjects.Graphics;
  private skillIcon: Phaser.GameObjects.Text;
  private keyLabel: Phaser.GameObjects.Text;
  private cooldownText: Phaser.GameObjects.Text;
  private cooldownOverlay: Phaser.GameObjects.Graphics;

  private currentSkill: string = 'dash';
  private cooldown: number = 0;
  private maxCooldown: number = 5000;

  private readonly size: number = 56;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const x = 10;
    const y = scene.cameras.main.height - this.size - 40;

    this.container = scene.add.container(x, y);
    this.container.setScrollFactor(0);
    this.container.setDepth(1000);

    // 图形层
    this.graphics = scene.add.graphics();
    this.container.add(this.graphics);

    // 冷却遮罩
    this.cooldownOverlay = scene.add.graphics();
    this.container.add(this.cooldownOverlay);

    // 技能图标
    this.skillIcon = scene.add.text(this.size / 2, 18, '⚡', {
      fontSize: '24px',
    });
    this.skillIcon.setOrigin(0.5);
    this.container.add(this.skillIcon);

    // 按键提示
    this.keyLabel = scene.add.text(this.size / 2, 42, '[Q]', {
      fontSize: '10px',
      fontFamily: PIXEL_FONTS.TITLE,
      color: PIXEL_COLORS.TEXT_WHITE,
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.keyLabel.setOrigin(0.5);
    this.container.add(this.keyLabel);

    // 冷却时间文字
    this.cooldownText = scene.add.text(this.size / 2, this.size / 2, '', {
      fontSize: '16px',
      fontFamily: PIXEL_FONTS.TEXT,
      color: PIXEL_COLORS.TEXT_WHITE,
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.cooldownText.setOrigin(0.5);
    this.cooldownText.setVisible(false);
    this.container.add(this.cooldownText);

    this.render();
  }

  update(skill: string, cooldown: number, maxCooldown: number) {
    this.currentSkill = skill;
    this.cooldown = cooldown;
    this.maxCooldown = maxCooldown;
    this.render();
  }

  private render() {
    this.graphics.clear();
    this.cooldownOverlay.clear();

    // 背景面板
    PixelUI.drawPixelBorder(
      this.graphics,
      0,
      0,
      this.size,
      this.size,
      2,
      PIXEL_COLORS.BORDER,
      PIXEL_COLORS.SKILL_BG,
      0.9
    );

    // 更新图标
    this.skillIcon.setText(SKILL_ICONS[this.currentSkill] || '⚡');

    // 冷却中
    if (this.cooldown > 0) {
      const progress = this.cooldown / this.maxCooldown;
      const overlayHeight = Math.floor((this.size - 4) * progress);

      // 灰色遮罩从上往下
      this.cooldownOverlay.fillStyle(0x000000, 0.6);
      this.cooldownOverlay.fillRect(2, 2, this.size - 4, overlayHeight);

      // 显示剩余秒数
      const seconds = Math.ceil(this.cooldown / 1000);
      this.cooldownText.setText(`${seconds}`);
      this.cooldownText.setVisible(true);
      this.skillIcon.setAlpha(0.5);
    } else {
      this.cooldownText.setVisible(false);
      this.skillIcon.setAlpha(1);
    }
  }

  destroy() {
    this.container.destroy();
  }
}
```

**Step 2: 集成到 GameScene**

```typescript
import { SkillBar } from '../ui/SkillBar';

// 添加属性
private skillBar!: SkillBar;

// 在 create() 中初始化
this.skillBar = new SkillBar(this);

// 在 update() 中更新
const player = this.state?.players.get(networkManager.getSessionId() || '');
if (player) {
  this.skillBar.update(player.character, player.skillCooldown, 5000);
}
```

**Step 3: 验证编译**

Run: `cd client && npx tsc --noEmit 2>&1 | head -10`

**Step 4: 提交**

```bash
git add client/src/ui/SkillBar.ts client/src/scenes/GameScene.ts
git commit -m "feat: add pixel-style skill bar with cooldown overlay"
```

---

### Task 1.7: 创建顶部信息栏

**Files:**
- Create: `client/src/ui/TopInfoBar.ts`

**Step 1: 创建顶部信息栏**

```typescript
import Phaser from 'phaser';
import { PixelUI, PIXEL_COLORS, PIXEL_FONTS } from './PixelUI';

export class TopInfoBar {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private graphics: Phaser.GameObjects.Graphics;
  private aliveText: Phaser.GameObjects.Text;
  private zoneText: Phaser.GameObjects.Text;
  private phaseText: Phaser.GameObjects.Text;

  private readonly width: number = 280;
  private readonly height: number = 32;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const x = (scene.cameras.main.width - this.width) / 2;
    const y = 10;

    this.container = scene.add.container(x, y);
    this.container.setScrollFactor(0);
    this.container.setDepth(1000);

    // 图形层
    this.graphics = scene.add.graphics();
    this.container.add(this.graphics);

    // 存活人数
    this.aliveText = scene.add.text(50, this.height / 2, '🏆 存活: 20/20', {
      fontSize: '11px',
      fontFamily: PIXEL_FONTS.TITLE,
      color: PIXEL_COLORS.TEXT_WHITE,
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.aliveText.setOrigin(0, 0.5);
    this.container.add(this.aliveText);

    // 缩圈倒计时
    this.zoneText = scene.add.text(this.width - 10, this.height / 2, '⏱ 缩圈: 60s', {
      fontSize: '11px',
      fontFamily: PIXEL_FONTS.TITLE,
      color: '#00aaff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.zoneText.setOrigin(1, 0.5);
    this.container.add(this.zoneText);

    // 阶段
    this.phaseText = scene.add.text(10, this.height / 2, '1', {
      fontSize: '14px',
      fontFamily: PIXEL_FONTS.TITLE,
      color: PIXEL_COLORS.TEXT_GOLD,
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.phaseText.setOrigin(0, 0.5);
    this.container.add(this.phaseText);

    this.render();
  }

  update(alivePlayers: number, totalPlayers: number, phase: number, zoneCountdown: number) {
    this.aliveText.setText(`🏆 存活: ${alivePlayers}/${totalPlayers}`);
    this.phaseText.setText(`${phase}`);

    const seconds = Math.max(0, Math.ceil(zoneCountdown / 1000));
    this.zoneText.setText(`⏱ 缩圈: ${seconds}s`);

    // 缩圈警告
    if (seconds < 10) {
      this.zoneText.setColor('#E53935');
    } else {
      this.zoneText.setColor('#00aaff');
    }

    this.render();
  }

  private render() {
    this.graphics.clear();

    // 背景面板
    PixelUI.drawPixelBorder(
      this.graphics,
      0,
      0,
      this.width,
      this.height,
      2,
      PIXEL_COLORS.BORDER,
      PIXEL_COLORS.PANEL_BG,
      0.7
    );
  }

  destroy() {
    this.container.destroy();
  }
}
```

**Step 2: 集成到 GameScene**

```typescript
import { TopInfoBar } from '../ui/TopInfoBar';

// 添加属性
private topInfoBar!: TopInfoBar;

// 在 create() 中初始化
this.topInfoBar = new TopInfoBar(this);

// 在 update() 中更新
if (this.state) {
  const zoneCountdown = this.calculateZoneCountdown();
  this.topInfoBar.update(
    this.state.alivePlayers,
    this.state.players.size,
    this.state.safeZone.phase + 1,
    zoneCountdown
  );
}

// 添加辅助方法
private calculateZoneCountdown(): number {
  // 简化实现，返回下次缩圈时间
  return 60000 - (this.state?.elapsedTime || 0) % 60000;
}
```

**Step 3: 提交**

```bash
git add client/src/ui/TopInfoBar.ts client/src/scenes/GameScene.ts
git commit -m "feat: add pixel-style top info bar with alive count and zone timer"
```

---

## Phase 2: 角色与道具像素化 (P2)

### Task 2.1: 创建像素角色精灵生成器

**Files:**
- Create: `client/src/graphics/PixelCharacter.ts`

**Step 1: 创建程序化像素角色生成器**

```typescript
import Phaser from 'phaser';

export interface CharacterColors {
  body: number;
  head: number;
  detail: number;
}

const CHARACTER_PALETTES: Record<string, CharacterColors> = {
  assault: { body: 0x4CAF50, head: 0x8BC34A, detail: 0x2E7D32 },
  sniper: { body: 0x1976D2, head: 0x42A5F5, detail: 0x0D47A1 },
  tank: { body: 0x757575, head: 0xBDBDBD, detail: 0xE53935 },
  medic: { body: 0xFFFFFF, head: 0xF5F5F5, detail: 0x4CAF50 },
};

export class PixelCharacter {
  /**
   * 生成 32x32 像素角色纹理
   */
  static generateTexture(
    scene: Phaser.Scene,
    textureKey: string,
    characterType: string
  ): void {
    const size = 32;
    const colors = CHARACTER_PALETTES[characterType] || CHARACTER_PALETTES.assault;

    // 创建 Canvas
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // 清除背景（透明）
    ctx.clearRect(0, 0, size, size);

    // 绘制像素角色
    this.drawPixelCharacter(ctx, colors, size);

    // 添加到 Phaser 纹理管理器
    if (scene.textures.exists(textureKey)) {
      scene.textures.remove(textureKey);
    }
    scene.textures.addCanvas(textureKey, canvas);
  }

  private static drawPixelCharacter(
    ctx: CanvasRenderingContext2D,
    colors: CharacterColors,
    size: number
  ) {
    const px = size / 16; // 像素单位

    // 辅助函数：绘制像素
    const drawPx = (x: number, y: number, w: number, h: number, color: number) => {
      ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
      ctx.fillRect(x * px, y * px, w * px, h * px);
    };

    // 身体（中心区域）
    drawPx(5, 6, 6, 8, colors.body);

    // 头部
    drawPx(6, 2, 4, 4, colors.head);

    // 眼睛
    drawPx(7, 3, 1, 1, 0x000000);
    drawPx(8, 3, 1, 1, 0x000000);

    // 细节（肩章/背包）
    drawPx(4, 6, 1, 3, colors.detail);
    drawPx(11, 6, 1, 3, colors.detail);

    // 腿
    drawPx(6, 14, 2, 2, colors.body);
    drawPx(8, 14, 2, 2, colors.body);

    // 黑色轮廓
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;

    // 简化的轮廓
    drawPx(5, 5, 6, 1, 0x000000);
    drawPx(5, 14, 6, 1, 0x000000);
    drawPx(4, 6, 1, 8, 0x000000);
    drawPx(11, 6, 1, 8, 0x000000);
  }

  /**
   * 生成所有角色类型的纹理
   */
  static generateAllTextures(scene: Phaser.Scene) {
    Object.keys(CHARACTER_PALETTES).forEach(type => {
      this.generateTexture(scene, `character_${type}`, type);
    });
  }
}
```

**Step 2: 在 GameScene 中生成纹理**

在 GameScene.create() 开头添加：

```typescript
import { PixelCharacter } from '../graphics/PixelCharacter';

// 在 create() 开头
PixelCharacter.generateAllTextures(this);
```

**Step 3: 提交**

```bash
git add client/src/graphics/PixelCharacter.ts client/src/scenes/GameScene.ts
git commit -m "feat: add procedural pixel character generator"
```

---

### Task 2.2: 创建像素武器图标生成器

**Files:**
- Create: `client/src/graphics/PixelItems.ts`

**Step 1: 创建程序化武器图标生成器**

```typescript
import Phaser from 'phaser';

const ITEM_COLORS: Record<string, { main: number; glow: number }> = {
  pistol: { main: 0x9E9E9E, glow: 0x757575 },
  smg: { main: 0x2196F3, glow: 0x1565C0 },
  rifle: { main: 0xFF9800, glow: 0xE65100 },
  shotgun: { main: 0xE53935, glow: 0xB71C1C },
  dash: { main: 0xFFEB3B, glow: 0xFFC107 },
  shield: { main: 0x7C4DFF, glow: 0x4A148C },
  backflip: { main: 0x00BCD4, glow: 0x0097A7 },
  healAura: { main: 0x4CAF50, glow: 0x2E7D32 },
};

export class PixelItems {
  /**
   * 生成 16x16 像素道具纹理
   */
  static generateTexture(
    scene: Phaser.Scene,
    textureKey: string,
    itemType: string
  ): void {
    const size = 16;
    const colors = ITEM_COLORS[itemType] || ITEM_COLORS.pistol;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, size, size);

    // 发光底座
    ctx.fillStyle = '#' + colors.glow.toString(16).padStart(6, '0');
    ctx.fillRect(2, 2, 12, 12);

    // 主体图标
    ctx.fillStyle = '#' + colors.main.toString(16).padStart(6, '0');
    ctx.fillRect(4, 4, 8, 8);

    // 高光
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(4, 4, 2, 2);
    ctx.globalAlpha = 1;

    // 边框
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(2.5, 2.5, 11, 11);

    if (scene.textures.exists(textureKey)) {
      scene.textures.remove(textureKey);
    }
    scene.textures.addCanvas(textureKey, canvas);
  }

  /**
   * 生成所有道具纹理
   */
  static generateAllTextures(scene: Phaser.Scene) {
    Object.keys(ITEM_COLORS).forEach(type => {
      this.generateTexture(scene, `item_${type}`, type);
    });
  }
}
```

**Step 2: 在 GameScene 中生成道具纹理**

```typescript
import { PixelItems } from '../graphics/PixelItems';

// 在 create() 中
PixelItems.generateAllTextures(this);
```

**Step 3: 提交**

```bash
git add client/src/graphics/PixelItems.ts client/src/scenes/GameScene.ts
git commit -m "feat: add procedural pixel item icon generator"
```

---

### Task 2.3: 更新 Player 使用像素精灵

**Files:**
- Modify: `client/src/entities/Player.ts`

**Step 1: 修改 Player 使用生成的纹理**

在 Player 构造函数中修改精灵创建逻辑：

```typescript
// 替换原来的几何图形创建
private createSprite(x: number, y: number, character: string) {
  const textureKey = `character_${character}`;

  // 检查纹理是否存在
  if (this.scene.textures.exists(textureKey)) {
    this.sprite = this.scene.add.sprite(x, y, textureKey);
  } else {
    // 后备：使用简单图形
    this.sprite = this.scene.add.sprite(x, y, 'character_assault');
  }

  this.sprite.setDepth(400);
  this.sprite.setOrigin(0.5);
}
```

**Step 2: 提交**

```bash
git add client/src/entities/Player.ts
git commit -m "feat: update Player to use pixel character sprites"
```

---

### Task 2.4: 更新 Item 使用像素精灵

**Files:**
- Modify: `client/src/entities/Item.ts`

**Step 1: 修改 Item 使用生成的纹理**

```typescript
// 在构造函数中
private createSprite(x: number, y: number, itemType: string, subType: string) {
  const textureKey = `item_${subType}`;

  if (this.scene.textures.exists(textureKey)) {
    this.sprite = this.scene.add.sprite(x, y, textureKey);
  } else {
    // 后备：使用简单图形
    this.sprite = this.scene.add.rectangle(x, y, 16, 16, 0xFFFFFF) as any;
  }

  this.sprite.setDepth(200);
  this.sprite.setOrigin(0.5);
}
```

**Step 2: 提交**

```bash
git add client/src/entities/Item.ts
git commit -m "feat: update Item to use pixel item sprites"
```

---

## Phase 3-4: 地图与环境 (P3-P4)

### Task 3.1: 创建瓦片地图生成器

**Files:**
- Create: `client/src/graphics/PixelTilemap.ts`

**Step 1: 创建程序化瓦片生成器**

```typescript
import Phaser from 'phaser';

const TILE_COLORS = {
  grass1: 0x4CAF50,
  grass2: 0x388E3C,
  dirt: 0x795548,
  stone: 0x9E9E9E,
  water: 0x2196F3,
};

export class PixelTilemap {
  static generateTileTextures(scene: Phaser.Scene) {
    const tileSize = 16;

    Object.entries(TILE_COLORS).forEach(([name, color]) => {
      const canvas = document.createElement('canvas');
      canvas.width = tileSize;
      canvas.height = tileSize;
      const ctx = canvas.getContext('2d')!;

      // 基础颜色
      ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
      ctx.fillRect(0, 0, tileSize, tileSize);

      // 添加像素噪点纹理
      for (let i = 0; i < 8; i++) {
        const px = Math.floor(Math.random() * tileSize);
        const py = Math.floor(Math.random() * tileSize);
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(px, py, 1, 1);
      }

      // 添加高光点
      for (let i = 0; i < 4; i++) {
        const px = Math.floor(Math.random() * tileSize);
        const py = Math.floor(Math.random() * tileSize);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(px, py, 1, 1);
      }

      const textureKey = `tile_${name}`;
      if (scene.textures.exists(textureKey)) {
        scene.textures.remove(textureKey);
      }
      scene.textures.addCanvas(textureKey, canvas);
    });
  }

  static createTilemapLayer(
    scene: Phaser.Scene,
    mapWidth: number,
    mapHeight: number,
    tileSize: number = 16
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(0, 0);
    container.setDepth(0);

    const tilesX = Math.ceil(mapWidth / tileSize);
    const tilesY = Math.ceil(mapHeight / tileSize);

    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        // 随机选择草地类型
        const tileType = Math.random() > 0.3 ? 'grass1' : 'grass2';
        const textureKey = `tile_${tileType}`;

        if (scene.textures.exists(textureKey)) {
          const tile = scene.add.image(x * tileSize, y * tileSize, textureKey);
          tile.setOrigin(0);
          container.add(tile);
        }
      }
    }

    return container;
  }
}
```

**Step 2: 提交**

```bash
git add client/src/graphics/PixelTilemap.ts
git commit -m "feat: add procedural pixel tilemap generator"
```

---

### Task 3.2: 集成瓦片地图到 GameScene

**Files:**
- Modify: `client/src/scenes/GameScene.ts`

**Step 1: 在 GameScene 中创建瓦片地图**

```typescript
import { PixelTilemap } from '../graphics/PixelTilemap';

// 在 create() 中，纹理生成之后
PixelTilemap.generateTileTextures(this);
const tilemap = PixelTilemap.createTilemapLayer(this, 2000, 2000, 32);
```

**Step 2: 移除旧的地图背景代码**

删除或注释原来的 `createMap()` 中的简单矩形背景。

**Step 3: 提交**

```bash
git add client/src/scenes/GameScene.ts
git commit -m "feat: integrate pixel tilemap into game scene"
```

---

## 验证与收尾

### Task 4.1: 整体验证

**Step 1: 启动服务并测试**

```bash
./stop.sh && ./start.sh
```

**Step 2: 验证清单**

- [ ] 拾取半径增大，道具可正常捡起
- [ ] 道具有悬浮动画
- [ ] 拾取时显示 "+武器名" 提示
- [ ] 血条为像素风格
- [ ] 弹药框为像素风格
- [ ] 小地图为方形像素边框
- [ ] 技能栏显示冷却
- [ ] 顶部信息栏显示存活人数和缩圈倒计时
- [ ] 角色使用像素精灵
- [ ] 道具使用像素图标
- [ ] 地图有像素瓦片纹理

**Step 3: 最终提交**

```bash
git add -A
git commit -m "feat: complete pixel style redesign

- Fix pickup radius (30->50)
- Add item float animation and glow
- Add pickup notification
- Redesign HP bar, ammo box, minimap, skill bar
- Add top info bar
- Generate pixel character sprites
- Generate pixel item icons
- Create pixel tilemap system"
```

---

## 文档版本

| 版本 | 日期 | 描述 |
|------|------|------|
| 1.0 | 2026-02-04 | 初始实施计划 |
