import { describe, it, expect } from 'vitest';
import { resolveRenderMode } from './render-mode';

describe('resolveRenderMode', () => {
  it('returns canvas when flag is true', () => {
    expect(resolveRenderMode('true')).toBe('canvas');
  });

  it('returns auto for any other value', () => {
    expect(resolveRenderMode(undefined)).toBe('auto');
    expect(resolveRenderMode('false')).toBe('auto');
    expect(resolveRenderMode('TRUE')).toBe('auto');
  });
});
