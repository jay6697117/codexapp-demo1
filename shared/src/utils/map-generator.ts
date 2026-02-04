
// Tile Types (Corresponding to tileset indices)
export const TILES = {
  EMPTY: 0,
  GROUND: 1,
  WALL: 2,
  WATER: 3,
  GRASS: 4,
  LAVA: 5,
  COBBLE: 6,
  FENCE: 7,
  FLOWER: 8,
  ROOF: 9,
};

export function generateTilemap(width: number, height: number): number[][] {
  const map: number[][] = [];

  // 1. Initialize with Grass
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      row.push(TILES.GRASS);
    }
    map.push(row);
  }

  // 2. Borders (Walls)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
            map[y][x] = TILES.WALL;
        }
    }
  }

  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  // 3. Central Plaza (Cobble) & Roads
  const roadWidth = 4;
  for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
          if (Math.abs(x - centerX) < roadWidth || Math.abs(y - centerY) < roadWidth) {
              map[y][x] = TILES.COBBLE;
          }
      }
  }

  // 4. Center Feature (Fountain/Water)
  for (let y = centerY - 2; y <= centerY + 2; y++) {
      for (let x = centerX - 2; x <= centerX + 2; x++) {
          map[y][x] = TILES.WATER;
      }
  }

  // 5. Symmetric Obstacles (Walls for cover)
  // Create defined cover spots in each quadrant
  const clusters = [
      { cx: width * 0.25, cy: height * 0.25 }, // Top-Left
      { cx: width * 0.75, cy: height * 0.25 }, // Top-Right
      { cx: width * 0.25, cy: height * 0.75 }, // Bottom-Left
      { cx: width * 0.75, cy: height * 0.75 }, // Bottom-Right
  ];

  clusters.forEach(cluster => {
      const cx = Math.floor(cluster.cx);
      const cy = Math.floor(cluster.cy);

      // L-Shape Wall
      for(let i=0; i<5; i++) {
        map[cy - 2 + i][cx - 2] = TILES.WALL; // Vertical
        map[cy - 2][cx - 2 + i] = TILES.WALL; // Horizontal
      }

      // Some random crates/fences near it
      map[cy + 3][cx + 3] = TILES.FENCE;
      map[cy + 3][cx - 3] = TILES.FENCE;
  });

  return map;
}

export function isCollidable(tileType: number): boolean {
    return [TILES.WALL, TILES.WATER, TILES.FENCE, TILES.ROOF, TILES.LAVA].includes(tileType);
}
