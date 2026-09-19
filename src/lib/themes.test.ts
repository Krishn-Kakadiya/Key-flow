import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { THEMES } from './themes';

const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

function tokens(theme: string): Record<string, string> {
  const re = theme === 'dark' ? /:root,\s*\[data-theme='dark'\]\s*\{([^}]*)\}/ : new RegExp(`\\[data-theme='${theme}'\\]\\s*\\{([^}]*)\\}`);
  const m = css.match(re);
  if (!m) throw new Error(`theme ${theme} not found`);
  const out: Record<string, string> = {};
  for (const line of m[1].split(';')) {
    const [k, v] = line.split(':').map((x) => x.trim());
    if (k && v) out[k.replace(/^--/, '')] = v;
  }
  return out;
}

const lin = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
function lum(hex: string) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrast(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

describe.each(THEMES.map((t) => t.id))('theme %s meets WCAG AA', (id) => {
  const t = tokens(id);
  it('body text and muted text (4.5:1)', () => {
    expect(contrast(t.text, t.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.text, t.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.muted, t.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.muted, t.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.muted, t['surface-2'])).toBeGreaterThanOrEqual(4.5);
  });
  it('typing text is large text (3:1): untyped, error, caret', () => {
    expect(contrast(t.untyped, t.bg)).toBeGreaterThanOrEqual(3);
    expect(contrast(t.untyped, t.surface)).toBeGreaterThanOrEqual(3);
    expect(contrast(t.error, t.bg)).toBeGreaterThanOrEqual(3);
    expect(contrast(t.caret, t.bg)).toBeGreaterThanOrEqual(3);
  });
  it('accent text and buttons', () => {
    expect(contrast(t.accent, t.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.accent, t.surface2 ?? t['surface-2'])).toBeGreaterThanOrEqual(3);
    expect(contrast(t['on-accent'], t.accent)).toBeGreaterThanOrEqual(4.5);
  });
  it('swatch in themes.ts matches the CSS', () => {
    const def = THEMES.find((x) => x.id === id)!;
    expect(def.swatch).toEqual([t.bg, t.surface, t.accent, t.caret]);
  });
});
