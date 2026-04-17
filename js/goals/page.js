import { initThemeToggle } from '../common/theme.js';
import { initGoalsTab } from './ui.js';

function init() {
  initThemeToggle();
  initGoalsTab();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

