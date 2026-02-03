import Phaser from 'phaser';
import { GAME_CONFIG, CHARACTERS } from '@shared/constants';
import { CharacterType, PlayerInput, WeaponType } from '@shared/types';
import { BulletManager } from '../managers/BulletManager';
import { WeaponManager } from '../managers/WeaponManager';

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

  update(input: PlayerInput, reloading: boolean = false) {
    if (!this.isLocalPlayer) return;

    // 更新武器管理器（处理换弹计时）
    this.weaponManager.update();

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
