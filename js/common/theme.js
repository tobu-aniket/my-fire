export function initThemeToggle() {
  const root = document.documentElement;
  const storedTheme = localStorage.getItem('fire-sheet4-theme');
  function applyTheme(mode) {
    if (mode === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    localStorage.setItem('fire-sheet4-theme', mode);
    const btn = document.getElementById('btn-theme');
    if (btn) btn.setAttribute('aria-pressed', mode === 'dark' ? 'true' : 'false');
  }
  if (
    storedTheme === 'dark' ||
    (!storedTheme && globalThis.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    applyTheme('dark');
  }
  const btn = document.getElementById('btn-theme');
  if (btn) {
    btn.addEventListener('click', () => {
      const dark = root.getAttribute('data-theme') === 'dark';
      applyTheme(dark ? 'light' : 'dark');
    });
  }
}

