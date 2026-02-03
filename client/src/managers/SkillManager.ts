import Phaser from 'phaser';
import { CHARACTERS } from '@shared/constants';
import { CharacterType } from '@shared/types';

export type SkillType = 'dash' | 'shield' | 'backflip' | 'healAura';

export interface SkillState {
  isActive: boolean;
  cooldownRemaining: number;
  duration: number;
}

export class SkillManager {
  private scene: Phaser.Scene;
  private characterType: CharacterType;
  private skillType: SkillType;
  private cooldown: number;
  private lastUseTime: number = 0;
  private isActive: boolean = false;
  private activeDuration: number = 0;
  private activeStartTime: number = 0;

  // 技能持续时间配置
  private static readonly SKILL_DURATIONS: Record<SkillType, number> = {
    dash: 200,      // 冲刺持续 200ms
    shield: 3000,   // 护盾持续 3 秒
    backflip: 300,  // 后空翻持续 300ms
    healAura: 5000, // 治疗光环持续 5 秒
  };

  // 技能名称（用于 HUD 显示）
  private static readonly SKILL_NAMES: Record<SkillType, string> = {
    dash: '冲刺',
    shield: '护盾',
    backflip: '后空翻',
    healAura: '治疗光环',
  };

  constructor(scene: Phaser.Scene, characterType: CharacterType) {
    this.scene = scene;
    this.characterType = characterType;
    this.skillType = CHARACTERS[characterType].skill as SkillType;
    this.cooldown = CHARACTERS[characterType].skillCooldown;
  }

  getSkillType(): SkillType {
    return this.skillType;
  }

  getSkillName(): string {
    return SkillManager.SKILL_NAMES[this.skillType];
  }

  getCooldown(): number {
    return this.cooldown;
  }

  canUseSkill(): boolean {
    if (this.isActive) return false;
    const now = Date.now();
    return now - this.lastUseTime >= this.cooldown;
  }

  getCooldownRemaining(): number {
    const now = Date.now();
    const elapsed = now - this.lastUseTime;
    return Math.max(0, this.cooldown - elapsed);
  }

  getCooldownPercent(): number {
    return 1 - (this.getCooldownRemaining() / this.cooldown);
  }

  isSkillActive(): boolean {
    return this.isActive;
  }

  useSkill(): boolean {
    if (!this.canUseSkill()) return false;

    this.lastUseTime = Date.now();
    this.isActive = true;
    this.activeStartTime = Date.now();
    this.activeDuration = SkillManager.SKILL_DURATIONS[this.skillType];

    return true;
  }

  update(): SkillState {
    // 检查技能是否结束
    if (this.isActive) {
      const elapsed = Date.now() - this.activeStartTime;
      if (elapsed >= this.activeDuration) {
        this.isActive = false;
      }
    }

    return {
      isActive: this.isActive,
      cooldownRemaining: this.getCooldownRemaining(),
      duration: this.activeDuration,
    };
  }
}
