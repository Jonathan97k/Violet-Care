import { getSetting, setSetting } from './db';

const THEME_KEY = 'theme';
export type Theme = 'dark' | 'lavender';

export async function getTheme(): Promise<Theme> {
  const s = await getSetting(THEME_KEY);
  return s?.value === 'lavender' ? 'lavender' : 'dark';
}

export async function setTheme(theme: Theme): Promise<void> {
  await setSetting(THEME_KEY, theme);
  applyTheme(theme);
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

export async function initTheme(): Promise<void> {
  const theme = await getTheme();
  applyTheme(theme);
}
