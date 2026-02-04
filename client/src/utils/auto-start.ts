export function shouldAutoStartGame(flag: string | undefined, search: string): boolean {
  if (flag === 'true') return true;
  if (!search) return false;
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  return params.get('autostart') === '1';
}
