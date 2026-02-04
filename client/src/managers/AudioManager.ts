import Phaser from 'phaser';

export type SoundType =
  | 'shoot_pistol'
  | 'shoot_smg'
  | 'shoot_rifle'
  | 'shoot_shotgun'
  | 'hit'
  | 'kill'
  | 'death'
  | 'pickup_weapon'
  | 'pickup_skill'
  | 'skill_dash'
  | 'skill_shield'
  | 'skill_backflip'
  | 'skill_heal'
  | 'reload'
  | 'empty_clip'
  | 'zone_warning'
  | 'zone_damage'
  | 'countdown'
  | 'game_start'
  | 'victory'
  | 'defeat';

// 音效配置
const SOUND_CONFIG: Record<SoundType, { volume: number; rate?: number }> = {
  shoot_pistol: { volume: 0.3 },
  shoot_smg: { volume: 0.25, rate: 1.2 },
  shoot_rifle: { volume: 0.4 },
  shoot_shotgun: { volume: 0.5 },
  hit: { volume: 0.4 },
  kill: { volume: 0.5 },
  death: { volume: 0.6 },
  pickup_weapon: { volume: 0.4 },
  pickup_skill: { volume: 0.4 },
  skill_dash: { volume: 0.5 },
  skill_shield: { volume: 0.5 },
  skill_backflip: { volume: 0.4 },
  skill_heal: { volume: 0.3 },
  reload: { volume: 0.3 },
  empty_clip: { volume: 0.2 },
  zone_warning: { volume: 0.6 },
  zone_damage: { volume: 0.3 },
  countdown: { volume: 0.5 },
  game_start: { volume: 0.6 },
  victory: { volume: 0.7 },
  defeat: { volume: 0.5 },
};

export class AudioManager {
  private scene: Phaser.Scene;
  private sounds: Map<SoundType, Phaser.Sound.BaseSound> = new Map();
  private masterVolume: number = 1.0;
  private sfxVolume: number = 1.0;
  private musicVolume: number = 0.5;
  private isMuted: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // 由于没有实际音频文件，我们使用 Web Audio API 生成简单的音效
  play(soundType: SoundType, options?: { volume?: number; rate?: number }) {
    if (this.isMuted) return;

    const config = SOUND_CONFIG[soundType];
    const volume = (options?.volume ?? config.volume) * this.sfxVolume * this.masterVolume;
    const rate = options?.rate ?? config.rate ?? 1;

    // 使用 Web Audio API 生成程序化音效
    this.playProceduralSound(soundType, volume, rate);
  }

  private playProceduralSound(soundType: SoundType, volume: number, rate: number) {
    try {
      const audioContext = this.scene.sound.context as AudioContext;
      if (!audioContext) return;

      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      gainNode.gain.value = volume;

      // 根据音效类型生成不同的声音
      switch (soundType) {
        case 'shoot_pistol':
          this.createShootSound(audioContext, gainNode, 200, 0.1, rate);
          break;
        case 'shoot_smg':
          this.createShootSound(audioContext, gainNode, 300, 0.05, rate);
          break;
        case 'shoot_rifle':
          this.createShootSound(audioContext, gainNode, 150, 0.15, rate);
          break;
        case 'shoot_shotgun':
          this.createShootSound(audioContext, gainNode, 100, 0.2, rate);
          break;
        case 'hit':
          this.createHitSound(audioContext, gainNode);
          break;
        case 'kill':
          this.createKillSound(audioContext, gainNode);
          break;
        case 'death':
          this.createDeathSound(audioContext, gainNode);
          break;
        case 'pickup_weapon':
        case 'pickup_skill':
          this.createPickupSound(audioContext, gainNode);
          break;
        case 'reload':
          this.createReloadSound(audioContext, gainNode);
          break;
        case 'empty_clip':
          this.createEmptyClipSound(audioContext, gainNode);
          break;
        case 'skill_dash':
        case 'skill_backflip':
          this.createDashSound(audioContext, gainNode);
          break;
        case 'skill_shield':
          this.createShieldSound(audioContext, gainNode);
          break;
        case 'skill_heal':
          this.createHealSound(audioContext, gainNode);
          break;
        case 'zone_warning':
          this.createZoneWarningSound(audioContext, gainNode);
          break;
        case 'zone_damage':
          this.createZoneDamageSound(audioContext, gainNode);
          break;
        case 'countdown':
          this.createCountdownSound(audioContext, gainNode);
          break;
        case 'game_start':
          this.createGameStartSound(audioContext, gainNode);
          break;
        case 'victory':
          this.createVictorySound(audioContext, gainNode);
          break;
        case 'defeat':
          this.createDefeatSound(audioContext, gainNode);
          break;
      }
    } catch (e) {
      // 忽略音频播放错误
    }
  }

  private createShootSound(ctx: AudioContext, gain: GainNode, freq: number, duration: number, rate: number) {
    const osc = ctx.createOscillator();
    const now = ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq * rate, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.1 * rate, now + duration);

    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + duration);
  }

  private createHitSound(ctx: AudioContext, gain: GainNode) {
    const osc = ctx.createOscillator();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  private createKillSound(ctx: AudioContext, gain: GainNode) {
    const now = ctx.currentTime;
    [1000, 1200, 1400].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.1);
    });
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
  }

  private createDeathSound(ctx: AudioContext, gain: GainNode) {
    const osc = ctx.createOscillator();
    const now = ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);

    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  private createPickupSound(ctx: AudioContext, gain: GainNode) {
    const now = ctx.currentTime;
    [400, 600, 800].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.08);
    });
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  }

  private createReloadSound(ctx: AudioContext, gain: GainNode) {
    const osc = ctx.createOscillator();
    const now = ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.setValueAtTime(400, now + 0.1);
    osc.frequency.setValueAtTime(500, now + 0.2);

    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  private createEmptyClipSound(ctx: AudioContext, gain: GainNode) {
    const osc = ctx.createOscillator();
    const now = ctx.currentTime;

    osc.type = 'square';
    osc.frequency.value = 100;
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  private createDashSound(ctx: AudioContext, gain: GainNode) {
    const osc = ctx.createOscillator();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);

    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  private createShieldSound(ctx: AudioContext, gain: GainNode) {
    const osc = ctx.createOscillator();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.setValueAtTime(800, now + 0.1);
    osc.frequency.setValueAtTime(600, now + 0.2);

    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  private createHealSound(ctx: AudioContext, gain: GainNode) {
    const now = ctx.currentTime;
    [500, 600, 700, 800].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.15);
    });
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
  }

  private createZoneWarningSound(ctx: AudioContext, gain: GainNode) {
    const now = ctx.currentTime;
    // 警报声：两个交替的音调
    for (let i = 0; i < 3; i++) {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.value = 800;
      osc2.frequency.value = 600;
      osc1.connect(gain);
      osc2.connect(gain);
      osc1.start(now + i * 0.4);
      osc1.stop(now + i * 0.4 + 0.15);
      osc2.start(now + i * 0.4 + 0.2);
      osc2.stop(now + i * 0.4 + 0.35);
    }
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
  }

  private createZoneDamageSound(ctx: AudioContext, gain: GainNode) {
    const osc = ctx.createOscillator();
    const now = ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.value = 100;
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  private createCountdownSound(ctx: AudioContext, gain: GainNode) {
    const osc = ctx.createOscillator();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  private createGameStartSound(ctx: AudioContext, gain: GainNode) {
    const now = ctx.currentTime;
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.2);
    });
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
  }

  private createVictorySound(ctx: AudioContext, gain: GainNode) {
    const now = ctx.currentTime;
    [523, 659, 784, 1047, 1319].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.3);
    });
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
  }

  private createDefeatSound(ctx: AudioContext, gain: GainNode) {
    const now = ctx.currentTime;
    [400, 350, 300, 250].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.3);
    });
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
  }

  setMasterVolume(volume: number) {
    this.masterVolume = Phaser.Math.Clamp(volume, 0, 1);
  }

  setSfxVolume(volume: number) {
    this.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  getSfxVolume(): number {
    return this.sfxVolume;
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }
}
