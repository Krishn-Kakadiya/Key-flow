export interface ThemeDef {
  id: string;
  name: string;
  unlockLevel: number;
  /** preview swatch: [bg, surface, accent, caret] */
  swatch: [string, string, string, string];
  dark: boolean;
}

// Keep swatches in sync with the CSS tokens in index.css.
export const THEMES: ThemeDef[] = [
  { id: 'dark', name: 'Keyflow Dark', unlockLevel: 1, swatch: ['#111318', '#1a1d24', '#5eead4', '#ffd166'], dark: true },
  { id: 'light', name: 'Light', unlockLevel: 1, swatch: ['#f6f7fb', '#ffffff', '#0f766e', '#c25e05'], dark: false },
  { id: 'paper', name: 'Paper', unlockLevel: 2, swatch: ['#f3ead8', '#fbf5e8', '#92400e', '#b45309'], dark: false },
  { id: 'retro', name: 'Retro Terminal', unlockLevel: 3, swatch: ['#0a0f0a', '#0f1a0f', '#33ff66', '#ffb000'], dark: true },
  { id: 'ocean', name: 'Ocean', unlockLevel: 5, swatch: ['#0b1622', '#102133', '#38bdf8', '#ffd166'], dark: true },
  { id: 'neon', name: 'Neon', unlockLevel: 7, swatch: ['#0b0616', '#150a26', '#00f0ff', '#f5ff5a'], dark: true },
];

export const DEFAULT_THEME = 'dark';

export function themeById(id: string): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function unlockedThemes(level: number): ThemeDef[] {
  return THEMES.filter((t) => t.unlockLevel <= level);
}

/** Themes that become available when going from `before` to `after`. */
export function newlyUnlocked(before: number, after: number): ThemeDef[] {
  return THEMES.filter((t) => t.unlockLevel > before && t.unlockLevel <= after);
}
