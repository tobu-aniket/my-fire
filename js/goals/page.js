import { initThemeToggle } from '../common/theme.js';
import { initResetAll } from '../common/reset.js';
import { initGoalsTab } from './ui.js';

const REQUIRED_IDS = ['goals-table', 'goals-tbody', 'goals-cagr', 'goals-start-year'];

function domReadyForGoals() {
  return REQUIRED_IDS.every((id) => document.getElementById(id));
}

/**
 * Goals UI needs specific nodes. Embedded previews / extensions sometimes run before
 * those nodes exist; retry a few frames instead of failing silently.
 */
function initGoalsWhenReady(attempt = 0) {
  const maxAttempts = 120;
  if (domReadyForGoals()) {
    try {
      initGoalsTab();
    } catch (err) {
      console.error('Goals: init failed', err);
    }
    return;
  }
  if (attempt >= maxAttempts) {
    console.error('Goals: required DOM nodes never appeared', REQUIRED_IDS);
    return;
  }
  if (attempt % 3 === 0) {
    requestAnimationFrame(() => initGoalsWhenReady(attempt + 1));
  } else {
    setTimeout(() => initGoalsWhenReady(attempt + 1), 16);
  }
}

function init() {
  initThemeToggle();
  initResetAll();
  queueMicrotask(() => initGoalsWhenReady(0));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

