import { initThemeToggle, setTheme } from '../common/theme.js';
import { initResetAll } from '../common/reset.js';

function fillThemeTokenValues() {
  document.querySelectorAll('.theme-scheme-card').forEach((card) => {
    card.querySelectorAll('[data-token]').forEach((el) => {
      const token = el.dataset.token;
      if (!token) return;
      const raw = getComputedStyle(card).getPropertyValue(token).trim();
      el.textContent = raw || '—';
    });
  });
}

function initThemeCardApplyButtons() {
  document.querySelectorAll('.theme-scheme-card').forEach((card) => {
    const themeId = card.dataset.theme || 'light';
    const header = card.querySelector('.theme-scheme-card__header');
    if (!header || header.querySelector('.theme-scheme-card__apply')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn theme-scheme-card__apply';
    btn.textContent = 'Apply';
    btn.dataset.applyTheme = themeId;
    btn.setAttribute('aria-label', `Apply ${themeId} theme`);
    header.appendChild(btn);
  });

  const grid = document.querySelector('.themes-grid');
  if (!grid) return;
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('button.theme-scheme-card__apply');
    if (!btn || !(btn instanceof HTMLButtonElement)) return;
    const id = btn.dataset.applyTheme;
    if (!id) return;
    setTheme(id);
  });
}

function init() {
  initThemeToggle();
  initResetAll();
  initThemeCardApplyButtons();
  fillThemeTokenValues();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
