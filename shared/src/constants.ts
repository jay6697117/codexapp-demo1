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
  LOBBY_WAIT_TIME: 30000,
  START_COUNTDOWN: 3000,

  // 游戏时长
  GAME_DURATION: 240000,
  ZONE_SHRINK_INTERVAL: 60000,

  // 网络配置
  SERVER_TICK_RATE: 20,
  CLIENT_SEND_RATE: 60,
} as const;

// 武器配置
export const WEAPONS = {
  pistol: {
    name: '手枪',
    damage: 10,
    fireRate: 400,
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
    damage: 25,
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
    passiveHeal: 1,
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
  shrinkDuration: 10000,
} as const;
