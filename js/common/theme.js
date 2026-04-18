const ALLOWED_THEMES = new Set([
  'light',
  'dark',
  'funky',
  'ocean',
  'midnight',
  'atomOneDark',
  'morningMystery',
  'vscodeDefault',
  'vscodeDark',
  'oneDarkPro',
  'matrix',
  'winamp',
  'supernova',
  'sunrise',
  'snowPeak',
]);

/** Apply a theme id and persist it. Syncs the optional header <select id="theme-select">. */
export function setTheme(mode) {
  const root = document.documentElement;
  const next = ALLOWED_THEMES.has(mode) ? mode : 'light';
  if (next === 'light') delete root.dataset.theme;
  else root.dataset.theme = next;
  localStorage.setItem('fire-sheet4-theme', next);

  const select = document.getElementById('theme-select');
  if (select && select instanceof HTMLSelectElement) select.value = next;
}

export function initThemeToggle() {
  const storedTheme = localStorage.getItem('fire-sheet4-theme');
  let initial = storedTheme;
  if (!ALLOWED_THEMES.has(initial || '')) {
    initial = globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  setTheme(initial || 'light');

  const select = document.getElementById('theme-select');
  if (select && select instanceof HTMLSelectElement) {
    select.addEventListener('change', () => setTheme(select.value));
  }
}
