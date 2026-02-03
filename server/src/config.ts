import { GAME_CONFIG } from '@pixel-arena/shared';

export const serverConfig = {
  port: Number(process.env.PORT) || 2567,
  ...GAME_CONFIG,
};
