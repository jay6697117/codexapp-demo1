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

  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      const isBorder = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      if (isBorder) {
        row.push(2);
        continue;
      }
      const r = rand();
      if (r < 0.05) {
        row.push(2);
      } else if (r < 0.15) {
        row.push(3);
      } else if (r < 0.25) {
        row.push(4);
      } else if (r < 0.35) {
        row.push(5);
      } else {
        row.push(1);
      }
    }
    map.push(row);
  }

  return map;
}
