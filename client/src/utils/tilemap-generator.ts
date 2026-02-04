function mulberry32(seed: number) {
  return function () {
    let t = seed += 0x6d2b79f5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateTilemap(width: number, height: number, seed: number = 1): number[][] {
  const rand = mulberry32(seed);
  const map: number[][] = [];

  // Indices based on AssetGenerator tileKeys order (+1 for Phaser 1-based indexing)
  const TILES = {
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

  // 1. Fill with Grass
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      // 2. Borders
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        row.push(TILES.WALL);
      } else {
        // Random flowers on grass
        row.push(rand() < 0.1 ? TILES.FLOWER : TILES.GRASS);
      }
    }
    map.push(row);
  }

  // 3. Roads (Cross shape)
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const roadWidth = 4;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (Math.abs(x - centerX) < roadWidth || Math.abs(y - centerY) < roadWidth) {
        map[y][x] = TILES.COBBLE;
      }
    }
  }

  // 4. Central Plaza/Fountain (Water)
  for (let y = centerY - 2; y <= centerY + 2; y++) {
    for (let x = centerX - 2; x <= centerX + 2; x++) {
      map[y][x] = TILES.WATER;
    }
  }

  // 5. Houses (Random Rectangles)
  const numHouses = 8;
  for (let i = 0; i < numHouses; i++) {
    const hW = 4 + Math.floor(rand() * 3);
    const hH = 3 + Math.floor(rand() * 3);
    const hX = 2 + Math.floor(rand() * (width - 4 - hW));
    const hY = 2 + Math.floor(rand() * (height - 4 - hH));

    // Check overlap with road or existing structures
    let overlap = false;
    for (let y = hY - 1; y < hY + hH + 1; y++) {
      for (let x = hX - 1; x < hX + hW + 1; x++) {
         if (map[y][x] !== TILES.GRASS && map[y][x] !== TILES.FLOWER) {
           overlap = true;
           break;
         }
      }
      if (overlap) break;
    }

    if (!overlap) {
      // Build House
      for (let y = hY; y < hY + hH; y++) {
        for (let x = hX; x < hX + hW; x++) {
          map[y][x] = TILES.ROOF;
        }
      }
      // Add Fence around house (optional simple fence logic)
      // (Skipping complex fence logic for now to keep it simple, maybe just one side)
    }
  }

  // 6. Random Obstacles (Fences/Rocks)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (map[y][x] === TILES.GRASS && rand() < 0.05) {
        map[y][x] = TILES.FENCE;
      }
    }
  }

  return map;
}
