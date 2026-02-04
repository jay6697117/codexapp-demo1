export function formatAliveText(alive: number, total: number): string {
  return `ALIVE ${alive}/${total}`;
}

export function formatZoneTimer(timeMs: number): string {
  if (timeMs <= 0) return 'FINAL';
  const seconds = Math.ceil(timeMs / 1000);
  return `RING ${seconds}s`;
}
