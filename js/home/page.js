import { initThemeToggle } from '../common/theme.js';

function init() {
  initThemeToggle();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

