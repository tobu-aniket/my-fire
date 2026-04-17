export function initThemeToggle() {
  const root = document.documentElement;
  const storedTheme = localStorage.getItem('fire-sheet4-theme');
  const allowedThemes = new Set([
    'light',
    'dark',
    'funky',
    'ocean',
    'midnight',
    'atomOneDark',
    'morningMystery',
  ]);
  function applyTheme(mode) {
    const next = allowedThemes.has(mode) ? mode : 'light';
    if (next === 'light') delete root.dataset.theme;
    else root.dataset.theme = next;
    localStorage.setItem('fire-sheet4-theme', next);

    const select = document.getElementById('theme-select');
    if (select && select instanceof HTMLSelectElement) select.value = next;
  }

  let initial = storedTheme;
  if (!allowedThemes.has(initial || '')) {
    initial = globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  applyTheme(initial || 'light');

  const select = document.getElementById('theme-select');
  if (select && select instanceof HTMLSelectElement) {
    select.addEventListener('change', () => applyTheme(select.value));
  }
}

