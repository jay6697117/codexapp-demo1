export type RenderMode = 'auto' | 'canvas';

export function resolveRenderMode(flag: string | undefined): RenderMode {
  return flag === 'true' ? 'canvas' : 'auto';
}
