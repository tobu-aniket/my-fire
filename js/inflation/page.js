import { initThemeToggle } from '../common/theme.js';
import { formatApproxInr } from '../utils.js';

const STORAGE_KEY = 'inflation_calc_v1';

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    return {
      current: Number(data.current),
      ratePct: Number(data.ratePct),
      years: Number(data.years),
    };
  } catch {
    return null;
  }
}

function writeStored(v) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

function inrMoney(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
}

function pct(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return (Math.round(v * 100) / 100).toLocaleString('en-IN') + ' %';
}

function clampNumber(n, fallback) {
  return Number.isFinite(n) ? n : fallback;
}

function compute({ current, ratePct, years }) {
  const pv = Math.max(0, Number(current));
  const r = Number(ratePct) / 100;
  const n = Math.max(0, Number(years));

  const growth = Math.pow(1 + r, n);
  const fv = pv * growth;
  const increased = fv - pv;
  const depreciationPct = (1 - 1 / growth) * 100;
  const realValue = pv / growth;

  return { pv, ratePct: Number(ratePct), years: n, fv, increased, depreciationPct, realValue };
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function init() {
  initThemeToggle();

  const inputCurrent = /** @type {HTMLInputElement|null} */ (document.getElementById('inf-current'));
  const inputRate = /** @type {HTMLInputElement|null} */ (document.getElementById('inf-rate'));
  const inputYears = /** @type {HTMLInputElement|null} */ (document.getElementById('inf-years'));
  const btnCalc = document.getElementById('inf-calc');

  if (!inputCurrent || !inputRate || !inputYears) return;

  const stored = readStored();
  const defaults = { current: 100000, ratePct: 5, years: 10 };
  const seed = stored ?? defaults;

  inputCurrent.value = String(clampNumber(seed.current, defaults.current));
  inputRate.value = String(clampNumber(seed.ratePct, defaults.ratePct));
  inputYears.value = String(clampNumber(seed.years, defaults.years));

  function recalc() {
    const current = Number.parseFloat(inputCurrent.value);
    const ratePct = Number.parseFloat(inputRate.value);
    const years = Number.parseFloat(inputYears.value);

    const data = compute({
      current: clampNumber(current, defaults.current),
      ratePct: clampNumber(ratePct, defaults.ratePct),
      years: clampNumber(years, defaults.years),
    });

    writeStored({ current: data.pv, ratePct: data.ratePct, years: data.years });

    setText('out-inf-today', inrMoney(data.pv));
    setText('out-inf-rate', pct(data.ratePct));
    setText('out-inf-increase', inrMoney(data.increased));
    setText('out-inf-depr', pct(data.depreciationPct));
    setText('out-inf-real', inrMoney(data.realValue));

    const approx = formatApproxInr(data.fv);
    const suffix = approx ? ` (${approx})` : '';
    setText('out-inf-fv', inrMoney(data.fv) + suffix);
  }

  inputCurrent.addEventListener('input', recalc);
  inputRate.addEventListener('input', recalc);
  inputYears.addEventListener('input', recalc);
  if (btnCalc) btnCalc.addEventListener('click', recalc);

  recalc();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

