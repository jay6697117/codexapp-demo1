import { WEAPONS } from '@shared/constants';
import { WeaponType } from '@shared/types';
import { BulletManager } from './BulletManager';

export class WeaponManager {
  private currentWeapon: WeaponType = 'pistol';
  private ammo: number;
  private maxAmmo: number;
  private lastFireTime: number = 0;
  private isReloading: boolean = false;
  private reloadStartTime: number = 0;

  constructor(initialWeapon: WeaponType = 'pistol') {
    this.currentWeapon = initialWeapon;
    this.maxAmmo = WEAPONS[initialWeapon].magazineSize;
    this.ammo = this.maxAmmo;
  }

  getCurrentWeapon(): WeaponType {
    return this.currentWeapon;
  }

  getWeaponName(): string {
    return WEAPONS[this.currentWeapon].name;
  }

  getAmmo(): number {
    return this.ammo;
  }

  getMaxAmmo(): number {
    return this.maxAmmo;
  }

  isCurrentlyReloading(): boolean {
    return this.isReloading;
  }

  getReloadProgress(): number {
    if (!this.isReloading) return 1;
    const reloadTime = WEAPONS[this.currentWeapon].reloadTime;
    const elapsed = Date.now() - this.reloadStartTime;
    return Math.min(elapsed / reloadTime, 1);
  }

  switchWeapon(weapon: WeaponType) {
    if (this.currentWeapon === weapon) return;
    this.currentWeapon = weapon;
    this.maxAmmo = WEAPONS[weapon].magazineSize;
    this.ammo = this.maxAmmo;
    this.isReloading = false;
  }

  canFire(): boolean {
    if (this.isReloading) return false;
    if (this.ammo <= 0) return false;

    const now = Date.now();
    const weaponConfig = WEAPONS[this.currentWeapon];
    return now - this.lastFireTime >= weaponConfig.fireRate;
  }

  fire(
    x: number,
    y: number,
    angle: number,
    ownerId: string,
    bulletManager: BulletManager
  ): boolean {
    if (!this.canFire()) return false;

    this.lastFireTime = Date.now();
    this.ammo--;

    const weaponConfig = WEAPONS[this.currentWeapon];

    // 霰弹枪发射多颗子弹
    if (this.currentWeapon === 'shotgun' && 'pellets' in weaponConfig) {
      const spread = 0.3; // 散布角度（弧度）
      for (let i = 0; i < weaponConfig.pellets; i++) {
        const offsetAngle = angle + (Math.random() - 0.5) * spread;
        bulletManager.fire(x, y, offsetAngle, ownerId, this.currentWeapon);
      }
    } else {
      bulletManager.fire(x, y, angle, ownerId, this.currentWeapon);
    }

    // 弹夹空时自动换弹
    if (this.ammo <= 0) {
      this.reload();
    }

    return true;
  }

  reload() {
    if (this.isReloading) return;
    if (this.ammo === this.maxAmmo) return;

    this.isReloading = true;
    this.reloadStartTime = Date.now();
  }

  update() {
    if (this.isReloading) {
      const reloadTime = WEAPONS[this.currentWeapon].reloadTime;
      if (Date.now() - this.reloadStartTime >= reloadTime) {
        this.ammo = this.maxAmmo;
        this.isReloading = false;
      }
    }
  }
}
