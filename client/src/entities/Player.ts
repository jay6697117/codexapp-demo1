import Phaser from 'phaser';
import { GAME_CONFIG, CHARACTERS } from '@shared/constants';
import { CharacterType, PlayerInput, WeaponType } from '@shared/types';
import { BulletManager } from '../managers/BulletManager';
import { WeaponManager } from '../managers/WeaponManager';
import { SkillManager } from '../managers/SkillManager';
import { SkillEffects } from '../effects/SkillEffects';
import { DamageEffects } from '../effects/DamageEffects';
import { HealthBar } from '../ui/HealthBar';
import { Item } from './Item';
import { ClientPrediction, InputSnapshot } from '../network/ClientPrediction';

export class Player extends Phaser.GameObjects.Container {
  public readonly playerId: string;
  public readonly characterType: CharacterType;
  public isLocalPlayer: boolean;

  private sprite: Phaser.GameObjects.Sprite;
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

  // 血量系统
  private hp: number;
  private maxHp: number;
  private healthBar: HealthBar;
  private damageEffects: DamageEffects;
  private isAlive: boolean = true;
  private kills: number = 0;
  private damageDealt: number = 0;

  // 客户端预测系统
  private prediction: ClientPrediction;
  private lastInputSnapshot: InputSnapshot | null = null;

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
    this.sprite = scene.add.sprite(0, 0, `player_${characterType}_down`);
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

    // 初始化血量系统
    this.maxHp = this.characterConfig.hp;
    this.hp = this.maxHp;
    this.damageEffects = new DamageEffects(scene);

    // 创建血条（在名字下方）
    this.healthBar = new HealthBar(scene, 0, -32, 40, 5, this.maxHp);
    this.add(this.healthBar);

    // 初始化客户端预测系统
    this.prediction = new ClientPrediction();
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
    this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
        this.heal(10);
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

  // 受到伤害
  takeDamage(damage: number, attackerId?: string): boolean {
    if (!this.isAlive || this.isInvincible) return false;

    this.hp = Math.max(0, this.hp - damage);
    this.healthBar.setHp(this.hp);

    // 伤害效果
    this.damageEffects.showDamageNumber(this.x, this.y, damage);
    this.damageEffects.playHitFlash(this);

    if (this.hp <= 0) {
      this.die();
      return true; // 已死亡
    }
    return false;
  }

  // 治疗
  heal(amount: number) {
    if (!this.isAlive) return;

    const actualHeal = Math.min(amount, this.maxHp - this.hp);
    if (actualHeal > 0) {
      this.hp += actualHeal;
      this.healthBar.setHp(this.hp);
      this.damageEffects.showHealNumber(this.x, this.y, actualHeal);
    }
  }

  // 死亡
  private die() {
    this.isAlive = false;
    this.damageEffects.playDeathEffect(this.x, this.y);

    // 隐藏玩家
    this.setVisible(false);
    this.bodyPhysics.enable = false;
  }

  // 获取血量
  getHp(): number {
    return this.hp;
  }

  // 获取最大血量
  getMaxHp(): number {
    return this.maxHp;
  }

  // 获取存活状态
  getIsAlive(): boolean {
    return this.isAlive;
  }

  // 获取击杀数
  getKills(): number {
    return this.kills;
  }

  // 增加击杀数
  addKill() {
    this.kills++;
  }

  // 增加造成的伤害
  addDamageDealt(amount: number) {
    this.damageDealt += amount;
  }

  // 获取造成的伤害
  getDamageDealt(): number {
    return this.damageDealt;
  }

  update(input: PlayerInput, reloading: boolean = false) {
    if (!this.isLocalPlayer) return;

    // 更新武器管理器（处理换弹计时）
    this.weaponManager.update();

    // 更新技能管理器
    this.skillManager.update();

    // 记录输入用于客户端预测
    if (input.dx !== 0 || input.dy !== 0) {
      this.lastInputSnapshot = this.prediction.recordInput(input.dx, input.dy, this.x, this.y);
    }

    // 移动
    const velocityX = input.dx * this.moveSpeed;
    const velocityY = input.dy * this.moveSpeed;
    this.bodyPhysics.setVelocity(velocityX, velocityY);

    // 朝向（使用方向动画代替旋转）
    this.updateVisuals(input.angle);

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

    this.setPosition(x, y);
    this.updateVisuals(angle);
  }

  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  /**
   * 服务器状态调和 - 当收到服务器位置更新时调用
   */
  reconcileWithServer(serverX: number, serverY: number, serverSequence: number) {
    if (!this.isLocalPlayer) return;

    // 检查是否需要调和
    if (!this.prediction.needsReconciliation(this.x, this.y, serverX, serverY)) {
      // 位置误差在阈值内，只需移除已确认的输入
      this.prediction.reconcile(
        { x: serverX, y: serverY, sequence: serverSequence, timestamp: Date.now() },
        this.moveSpeed,
        this.scene.game.loop.delta
      );
      return;
    }

    const serverState = {
      x: serverX,
      y: serverY,
      sequence: serverSequence,
      timestamp: Date.now(),
    };

    // 从服务器状态重新应用未确认的输入
    const reconciled = this.prediction.reconcile(serverState, this.moveSpeed, this.scene.game.loop.delta);

    if (reconciled) {
      // 平滑过渡到调和后的位置，避免跳跃感
      const smooth = this.prediction.smoothReconcile(
        this.x,
        this.y,
        reconciled.x,
        reconciled.y,
        0.2
      );
      this.setPosition(smooth.x, smooth.y);
    }
  }

  /**
   * 获取最后一次输入快照（用于网络发送）
   */
  getLastInputSnapshot(): InputSnapshot | null {
    return this.lastInputSnapshot;
  }

  /**
   * 获取当前输入序列号
   */
  getInputSequence(): number {
    return this.prediction.getSequence();
  }

  /**
   * 获取待处理输入数量（用于调试）
   */
  getPendingInputCount(): number {
    return this.prediction.getPendingCount();
  }

  /**
   * 清空预测状态（重生时调用）
   */
  clearPrediction() {
    this.prediction.clear();
    this.lastInputSnapshot = null;
  }

  destroy(fromScene?: boolean) {
    this.sprite.destroy();
    this.nameText.destroy();
    this.healthBar.destroy();
    super.destroy(fromScene);
  }

  private updateVisuals(angleRad: number) {
    // 将弧度转换为角度 (-180 到 180)
    let degrees = Phaser.Math.RadToDeg(angleRad);

    // 确定 4 个方向
    // Right: -45 to 45
    // Down: 45 to 135
    // Left: 135 to 180 / -180 to -135
    // Up: -135 to -45

    let direction = 'down';
    let flipX = false;

    if (degrees > -45 && degrees <= 45) {
      direction = 'side'; // Right
      flipX = false;
    } else if (degrees > 45 && degrees <= 135) {
      direction = 'down';
    } else if (degrees > -135 && degrees <= -45) {
      direction = 'up';
    } else {
      direction = 'side'; // Left
      flipX = true;
    }

    // 播放对应方向动画 (由于只有1帧，play和setTexture效果类似，但play支持扩展)
    const animKey = `${this.characterType}_${direction}`;

    // 只有当动画改变时才播放，避免重置帧
    if (this.sprite.anims.currentAnim?.key !== animKey) {
        this.sprite.play(animKey);
    }

    this.sprite.setFlipX(flipX);

    // 取消旋转，确保像素不对齐
    this.sprite.setRotation(0);
  }
}
