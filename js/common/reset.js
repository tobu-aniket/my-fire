export function initResetAll() {
  const btn = document.getElementById('btn-reset-all');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const ok = globalThis.confirm
      ? globalThis.confirm('Reset all saved data and return to defaults? This will clear local data for FIRE, Goals, and Inflation.')
      : true;
    if (!ok) return;
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
    globalThis.location.reload();
  });
}

