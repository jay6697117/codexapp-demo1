export interface MinimapTransform {
  scale: number;
  displayWidth: number;
  displayHeight: number;
  offsetX: number;
  offsetY: number;
}

export function getMinimapTransform(mapWidth: number, mapHeight: number, size: number): MinimapTransform {
  const scale = size / Math.max(mapWidth, mapHeight);
  const displayWidth = mapWidth * scale;
  const displayHeight = mapHeight * scale;
  const offsetX = (size - displayWidth) / 2;
  const offsetY = (size - displayHeight) / 2;
  return { scale, displayWidth, displayHeight, offsetX, offsetY };
}

export function worldToMinimap(worldX: number, worldY: number, transform: MinimapTransform) {
  return {
    x: transform.offsetX + worldX * transform.scale,
    y: transform.offsetY + worldY * transform.scale,
  };
}
