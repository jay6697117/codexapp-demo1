import Phaser from 'phaser';
import { GAME_CONFIG, CHARACTERS } from '@shared/constants';
import { CharacterType, PlayerInput, WeaponType } from '@shared/types';
import { BulletManager } from '../managers/BulletManager';
import { WeaponManager } from '../managers/WeaponManager';
import { SkillManager } from '../managers/SkillManager';
import { SkillEffects } from '../effects/SkillEffects';
import { Item } from './Item';

export class Player extends Phaser.GameObjects.Container {
  public readonly playerId: string;
  public readonly characterType: CharacterType;
  public isLocalPlayer: boolean;

  private sprite: Phaser.GameObjects.Image;
  private nameText: Phaser.GameObjects.Text;
  private bodyPhysics!: Phaser.Physics.Arcade.Body;

  private characterConfig: typeof CHARACTERS[CharacterType];
  private moveSpeed: number;

  // 武器系统
  private weaponManager: WeaponManager;
  private bulletManager: BulletManager | null = null;

  // 技能系统
  private skillManager: SkillManager;
  private skillEffects: SkillEffects;
  private shieldGraphics: Phaser.GameObjects.Graphics | null = null;
  private healAuraGraphics: Phaser.GameObjects.Graphics | null = null;
  private isInvincible: boolean = false;
  private skillKeyPressed: boolean = false;

  // 道具技能（从道具拾取的技能）
  private itemSkill: string | null = null;

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
    this.bodyPhysics = this.body as Phaser.Physics.Arcade.Body;
    this.bodyPhysics.setCollideWorldBounds(true);
    this.bodyPhysics.setSize(GAME_CONFIG.PLAYER_SIZE, GAME_CONFIG.PLAYER_SIZE);
    this.bodyPhysics.setOffset(-GAME_CONFIG.PLAYER_SIZE / 2, -GAME_CONFIG.PLAYER_SIZE / 2);

    // 初始化武器管理器
    this.weaponManager = new WeaponManager('pistol');

    // 初始化技能系统
    this.skillManager = new SkillManager(scene, characterType);
    this.skillEffects = new SkillEffects(scene);
  }

  // 设置 BulletManager
  setBulletManager(manager: BulletManager) {
    this.bulletManager = manager;
  }

  // 获取武器管理器
  getWeaponManager(): WeaponManager {
    return this.weaponManager;
  }

  // 射击
  fire(angle: number) {
    if (!this.bulletManager) return;

    // 从玩家前方发射子弹
    const offsetX = Math.cos(angle) * 20;
    const offsetY = Math.sin(angle) * 20;

    this.weaponManager.fire(
      this.x + offsetX,
      this.y + offsetY,
      angle,
      this.playerId,
      this.bulletManager
    );
  }

  // 换弹
  reload() {
    this.weaponManager.reload();
  }

  // 切换武器
  switchWeapon(weapon: WeaponType) {
    this.weaponManager.switchWeapon(weapon);
  }

  // 拾取道具
  pickupItem(item: Item) {
    if (item.itemType === 'weapon') {
      // 切换武器
      this.weaponManager.switchWeapon(item.subType as WeaponType);
    } else if (item.itemType === 'skill') {
      // 存储技能道具（后续任务实现具体技能）
      this.itemSkill = item.subType;
    }
  }

  // 获取当前持有的道具技能
  getItemSkill(): string | null {
    return this.itemSkill;
  }

  // 清除道具技能（使用后）
  clearItemSkill() {
    this.itemSkill = null;
  }

  // 使用角色技能
  useSkill(angle: number) {
    if (!this.skillManager.useSkill()) return;

    const skillType = this.skillManager.getSkillType();

    switch (skillType) {
      case 'dash':
        this.executeDash(angle);
        break;
      case 'shield':
        this.executeShield();
        break;
      case 'backflip':
        this.executeBackflip(angle);
        break;
      case 'healAura':
        this.executeHealAura();
        break;
    }
  }

  // 冲刺：快速向前移动
  private executeDash(angle: number) {
    const dashDistance = 150;
    const dashDuration = 200;

    this.skillEffects.playDashEffect(this.x, this.y, angle);
    this.isInvincible = true;

    this.scene.tweens.add({
      targets: this,
      x: this.x + Math.cos(angle) * dashDistance,
      y: this.y + Math.sin(angle) * dashDistance,
      duration: dashDuration,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.isInvincible = false;
      },
    });
  }

  // 护盾：临时无敌
  private executeShield() {
    this.isInvincible = true;
    this.shieldGraphics = this.skillEffects.createShieldEffect(this);

    this.scene.time.delayedCall(3000, () => {
      this.isInvincible = false;
      if (this.shieldGraphics) {
        this.shieldGraphics.destroy();
        this.shieldGraphics = null;
      }
    });
  }

  // 后空翻：向后跳跃
  private executeBackflip(angle: number) {
    this.isInvincible = true;
    this.skillEffects.playBackflipEffect(this, angle);

    this.scene.time.delayedCall(300, () => {
      this.isInvincible = false;
    });
  }

  // 治疗光环：持续回血
  private executeHealAura() {
    this.healAuraGraphics = this.skillEffects.createHealAuraEffect(this);

    // 每秒回复 10 HP，持续 5 秒
    const healInterval = this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
        // 回血逻辑（后续 Task 2.5 实现 HP 系统）
        console.log('Heal +10 HP');
      },
      repeat: 4,
    });

    this.scene.time.delayedCall(5000, () => {
      if (this.healAuraGraphics) {
        this.healAuraGraphics.destroy();
        this.healAuraGraphics = null;
      }
    });
  }

  // 获取技能管理器
  getSkillManager(): SkillManager {
    return this.skillManager;
  }

  // 获取技能冷却百分比
  getSkillCooldownPercent(): number {
    return this.skillManager.getCooldownPercent();
  }

  // 技能是否就绪
  isSkillReady(): boolean {
    return this.skillManager.canUseSkill();
  }

  // 是否无敌状态
  isPlayerInvincible(): boolean {
    return this.isInvincible;
  }

  update(input: PlayerInput, reloading: boolean = false) {
    if (!this.isLocalPlayer) return;

    // 更新武器管理器（处理换弹计时）
    this.weaponManager.update();

    // 更新技能管理器
    this.skillManager.update();

    // 移动
    const velocityX = input.dx * this.moveSpeed;
    const velocityY = input.dy * this.moveSpeed;
    this.bodyPhysics.setVelocity(velocityX, velocityY);

    // 朝向（旋转精灵）
    this.sprite.setRotation(input.angle + Math.PI / 2); // +90度因为精灵默认朝上

    // 换弹
    if (reloading) {
      this.reload();
    }

    // 射击
    if (input.shooting) {
      this.fire(input.angle);
    }

    // 技能使用（防止按住连续触发）
    if (input.skill && !this.skillKeyPressed) {
      this.skillKeyPressed = true;
      this.useSkill(input.angle);
    } else if (!input.skill) {
      this.skillKeyPressed = false;
    }
  }

  // 用于网络同步：设置目标位置
  setTargetPosition(x: number, y: number, angle: number) {
    if (this.isLocalPlayer) return;

    // 简单设置位置（后续会改进为插值）
    this.setPosition(x, y);
    this.sprite.setRotation(angle + Math.PI / 2);
  }

  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  destroy(fromScene?: boolean) {
    this.sprite.destroy();
    this.nameText.destroy();
    super.destroy(fromScene);
  }
}
