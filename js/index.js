/**
 * My FIRE — browser entrypoint.
 * Splits constants/utils/formulas for maintainability.
 */

import { DEFAULTS, FIRE_TYPE_DEFINITIONS, INFO_ICON_SVG } from './constants.js';
import { compute } from './formulas.js';
import { initGoalsTab } from './goals/ui.js';
import {
  decodeHash,
  decodeQuery,
  el,
  formatApproxDisplay,
  formatApproxInr,
  formatInr,
  loadFromStorage,
  sanitizeInputs,
  saveToStorage,
  updateUrlQuery,
} from './utils.js';

const fireSortState = {
  key: /** @type {'label'|'formula'|'corpus'|'approx'|''} */ (''),
  dir: /** @type {1|-1} */ (1),
  phase: /** @type {0|1|2} */ (0), // 0=none, 1=asc, 2=desc
};

/**
 * @param {Array<{key:string,label:string,formula:string,j:number}>} rows
 */
function sortFireRows(rows) {
  if (!fireSortState.key || fireSortState.phase === 0) return rows;
  const dir = fireSortState.dir;
  const key = fireSortState.key;
  return rows
    .map((r, idx) => ({ r, idx }))
    .sort((a, b) => {
      let av;
      let bv;
      if (key === 'label') {
        av = a.r.label.toLowerCase();
        bv = b.r.label.toLowerCase();
      } else if (key === 'formula') {
        av = a.r.formula.toLowerCase();
        bv = b.r.formula.toLowerCase();
      } else {
        av = a.r.j;
        bv = b.r.j;
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return a.idx - b.idx;
    })
    .map((x) => x.r);
}

function updateFireHeaderSortUi() {
  const table = document.getElementById('fire-table');
  if (!table) return;
  const ths = table.querySelectorAll('thead th[data-sort]');
  ths.forEach((th) => {
    const k = th.getAttribute('data-sort');
    if (k && k === fireSortState.key && fireSortState.phase !== 0) {
      th.setAttribute(
        'aria-sort',
        fireSortState.dir === 1 ? 'ascending' : 'descending'
      );
    } else {
      th.setAttribute('aria-sort', 'none');
    }
  });
}

function readForm() {
  return sanitizeInputs({
    c2: Number.parseFloat(/** @type {HTMLInputElement} */ (el('in-c2')).value),
    f2: Number.parseFloat(/** @type {HTMLInputElement} */ (el('in-f2')).value),
    c4: Number.parseFloat(/** @type {HTMLInputElement} */ (el('in-c4')).value),
    f4: Number.parseFloat(/** @type {HTMLInputElement} */ (el('in-f4')).value),
    f7: Number.parseFloat(/** @type {HTMLInputElement} */ (el('in-f7')).value),
    a22: Number.parseFloat(/** @type {HTMLInputElement} */ (el('in-a22')).value),
  });
}

function writeForm(inputs) {
  const i = sanitizeInputs(inputs);
  /** @type {HTMLInputElement} */ (el('in-c2')).value = String(i.c2);
  /** @type {HTMLInputElement} */ (el('in-f2')).value = String(i.f2);
  /** @type {HTMLInputElement} */ (el('in-c4')).value = String(i.c4);
  /** @type {HTMLInputElement} */ (el('in-f4')).value = String(i.f4);
  /** @type {HTMLInputElement} */ (el('in-f7')).value = String(i.f7);
  /** @type {HTMLInputElement} */ (el('in-a22')).value = String(i.a22);
  return i;
}

function loadFromUrl() {
  const fromQuery = decodeQuery();
  if (fromQuery) return sanitizeInputs({ ...fromQuery, a22: fromQuery.f7 });

  const legacy = decodeHash(window.location.hash);
  if (!legacy) return null;

  const merged = { ...DEFAULTS, ...legacy };
  let s = sanitizeInputs(merged);
  if (legacy.a22 === undefined) {
    merged.a22 = s.f7;
    s = sanitizeInputs(merged);
  }

  // Migrate legacy hash link into readable query params.
  updateUrlQuery(s);
  if (globalThis.location.hash) globalThis.location.hash = '';
  return s;
}

/**
 * @param {{ key: string, label: string }} row
 */
function buildFireTypeHeader(row) {
  const th = document.createElement('th');
  th.scope = 'row';
  th.className = 'fire-type-th';

  const cell = document.createElement('span');
  cell.className = 'fire-type-cell';

  const name = document.createElement('span');
  name.className = 'fire-type-name';
  name.textContent = row.label;

  const tipId = 'fire-tip-' + row.key;
  const wrap = document.createElement('span');
  wrap.className = 'info-wrap';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'info-btn';
  btn.setAttribute('aria-label', row.label + ': definition');
  btn.setAttribute('aria-describedby', tipId);
  btn.innerHTML = INFO_ICON_SVG;

  const tip = document.createElement('span');
  tip.id = tipId;
  tip.className = 'info-tooltip';
  tip.setAttribute('role', 'tooltip');
  tip.textContent = FIRE_TYPE_DEFINITIONS[row.key] || 'No definition available.';

  wrap.appendChild(btn);
  wrap.appendChild(tip);

  cell.appendChild(name);
  cell.appendChild(wrap);
  th.appendChild(cell);
  return th;
}

function applyResults(data) {
  el('out-c3').textContent = formatInr(data.c3);
  el('out-c5').textContent = String(Math.round(data.c5));
  el('out-c7').textContent = formatInr(data.c7);
  el('out-c8').textContent = formatInr(data.c8);

  const tbody = /** @type {HTMLTableSectionElement} */ (el('fire-tbody'));
  tbody.innerHTML = '';
  const fireRows = sortFireRows(data.fireRows);
  updateFireHeaderSortUi();
  fireRows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.appendChild(buildFireTypeHeader(row));

    const tdFormula = document.createElement('td');
    const code = document.createElement('code');
    code.textContent = row.formula;
    tdFormula.appendChild(code);

    const tdInr = document.createElement('td');
    tdInr.className = 'num';
    tdInr.textContent = formatInr(row.j);

    const tdApprox = document.createElement('td');
    tdApprox.className = 'num hint';
    tdApprox.textContent = formatApproxDisplay(row.j);

    tr.appendChild(tdFormula);
    tr.appendChild(tdInr);
    tr.appendChild(tdApprox);
    tbody.appendChild(tr);
  });

  const swrBody = /** @type {HTMLTableSectionElement} */ (el('swr-tbody'));
  swrBody.innerHTML = '';
  data.swrRows.forEach((r) => {
    const tr = document.createElement('tr');
    const std = r.swr === 4;
    if (std) tr.classList.add('row-std-fire');
    tr.innerHTML =
      '<td class="num">' +
      r.swr +
      '</td><td class="num">' +
      (Math.round(r.mult * 1e8) / 1e8) +
      '</td><td class="num">' +
      formatInr(r.annualExpense) +
      '</td><td class="num">' +
      formatInr(r.corpus) +
      '</td><td class="num hint">' +
      formatApproxDisplay(r.corpus) +
      '</td>';
    swrBody.appendChild(tr);
  });

  const note = el('std-fire-note');
  if (note) {
    note.textContent =
      'Standard FIRE number (4% row): ' + formatInr(data.swrRows[4].corpus);
  }

  if (data.custom && data.custom.valid) {
    el('out-b23').textContent = String(Math.round(data.custom.b23 * 100) / 100);
    el('out-c23').textContent = String(Math.round(data.custom.c23 * 1e8) / 1e8);
    el('out-d23').textContent = formatInr(data.custom.d23);
    el('out-e23').textContent = formatInr(data.custom.e23);
    el('out-g23').textContent = formatApproxDisplay(data.custom.e23);
    el('custom-warning').hidden = true;
  } else {
    el('out-b23').textContent = '—';
    el('out-c23').textContent = '—';
    el('out-d23').textContent = formatInr(data.c8);
    el('out-e23').textContent = '—';
    el('out-g23').textContent = '—';
    el('custom-warning').hidden = false;
    el('custom-warning').textContent =
      data.custom && data.custom.b23 <= 0
        ? 'Spread (Expected CAGR − inflation) must be positive for this multiplier.'
        : 'Spread is invalid; adjust Expected CAGR or inflation.';
  }
}

function recalc() {
  const inputs = readForm();
  const data = compute(inputs);
  applyResults(data);
  saveToStorage(inputs);
  updateUrlQuery(inputs);
  const linkEl = /** @type {HTMLInputElement} */ (el('share-link'));
  if (linkEl) linkEl.value = window.location.href;
}

function init() {
  const fromStore = loadFromStorage();
  const fromUrl = loadFromUrl();
  const initial = fromUrl || fromStore || DEFAULTS;
  writeForm(initial);

  // Tabs
  const tabButtons = document.querySelectorAll('.tab-btn[data-tab]');
  const panels = document.querySelectorAll('.tab-panel[data-tab-panel]');
  function setTab(tab) {
    tabButtons.forEach((b) => {
      if (b.getAttribute('data-tab') === tab) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    panels.forEach((p) => {
      const t = p.getAttribute('data-tab-panel');
      if (t === tab) p.removeAttribute('hidden');
      else p.setAttribute('hidden', '');
    });
    if (tab === 'goals') initGoalsTab();
  }
  tabButtons.forEach((b) => {
    b.addEventListener('click', () => setTab(b.getAttribute('data-tab')));
  });
  setTab('fire');

  const fireTable = document.getElementById('fire-table');
  if (fireTable) {
    fireTable.querySelectorAll('thead th[data-sort] .sort-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const th = /** @type {HTMLElement} */ (btn.closest('th'));
        const key = th ? th.getAttribute('data-sort') : null;
        if (!key) return;
        if (fireSortState.key !== key) {
          fireSortState.key = /** @type {any} */ (key);
          fireSortState.phase = 1;
          fireSortState.dir = 1;
        } else if (fireSortState.phase === 0) {
          fireSortState.phase = 1;
          fireSortState.dir = 1;
        } else if (fireSortState.phase === 1) {
          fireSortState.phase = 2;
          fireSortState.dir = -1;
        } else {
          fireSortState.phase = 0;
          fireSortState.dir = 1;
        }
        recalc();
      });
    });
  }

  ['in-c2', 'in-f2', 'in-c4', 'in-f4', 'in-f7', 'in-a22'].forEach((id) => {
    el(id).addEventListener('input', recalc);
    el(id).addEventListener('change', recalc);
  });

  el('btn-reset').addEventListener('click', () => {
    writeForm(DEFAULTS);
    recalc();
  });

  el('btn-copy-url').addEventListener('click', () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => {
        const b = el('btn-copy-url');
        const t = b.textContent;
        b.textContent = 'Copied';
        setTimeout(() => {
          b.textContent = t;
        }, 1500);
      },
      () => {}
    );
  });

  el('btn-copy-csv').addEventListener('click', () => {
    const data = compute(readForm());
    const lines = [
      ['SWR %', 'Multiplier', 'Annual expense', 'Corpus (₹)', 'Approx. (Cr/lakhs/…)'],
    ];
    data.swrRows.forEach((r) => {
      lines.push([
        String(r.swr),
        String(r.mult),
        String(r.annualExpense),
        String(Math.round(r.corpus)),
        formatApproxInr(r.corpus),
      ]);
    });
    const csv = lines
      .map((row) =>
        row.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')
      )
      .join('\n');
    navigator.clipboard.writeText(csv).then(
      () => {
        const b = el('btn-copy-csv');
        const t = b.textContent;
        b.textContent = 'Copied';
        setTimeout(() => {
          b.textContent = t;
        }, 1500);
      },
      () => {}
    );
  });

  // Theme
  const root = document.documentElement;
  const storedTheme = localStorage.getItem('fire-sheet4-theme');
  function applyTheme(mode) {
    if (mode === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    localStorage.setItem('fire-sheet4-theme', mode);
    const btn = el('btn-theme');
    if (btn) btn.setAttribute('aria-pressed', mode === 'dark' ? 'true' : 'false');
  }
  if (
    storedTheme === 'dark' ||
    (!storedTheme && globalThis.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    applyTheme('dark');
  }
  el('btn-theme').addEventListener('click', () => {
    const dark = root.getAttribute('data-theme') === 'dark';
    applyTheme(dark ? 'light' : 'dark');
  });

  recalc();
  const share = /** @type {HTMLInputElement} */ (el('share-link'));
  if (share) share.value = window.location.href;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

