import { getGoalsDefaultPlanningStartYear, GOALS_STORAGE_KEYS } from '../constants.js';
import { formatInr } from '../utils.js';
import { getDefaultGoalRows, getDefaultGoalStrings, shouldUseDefaultGoals } from './defaultRows.js';
import { computeGoalDerived } from './formulas.js';
import {
  loadExpectedCagrPct,
  loadGoalsRows,
  loadOptions,
  loadPlanningStartYear,
  newGoalRow,
  saveExpectedCagrPct,
  saveGoalsRows,
  saveOptions,
  savePlanningStartYear,
} from './state.js';

const sortState = {
  key: '',
  dir: 1,
  phase: 0,
};

function normalize(s) {
  return String(s ?? '').toLowerCase().trim();
}

/** Display: `"Title": detail` when both parts exist. */
function formatCombinedGoal(row) {
  const g = String(row.goal ?? '').trim();
  const r = String(row.realisedGoal ?? '').trim();
  if (g && r) return `"${g}": ${r}`;
  if (g) return g;
  return r;
}

/** Parse edited cell back into goal + realisedGoal. */
function parseCombinedGoal(text) {
  const s = String(text ?? '').trim();
  const quoted = /^"([^"]*)"\s*:\s*(.*)$/.exec(s);
  if (quoted) {
    return { goal: quoted[1].trim(), realisedGoal: quoted[2].trim() };
  }
  const colon = s.indexOf(':');
  if (colon !== -1) {
    let left = s.slice(0, colon).trim();
    if (left.length >= 2 && left.startsWith('"') && left.endsWith('"')) {
      left = left.slice(1, -1).trim();
    }
    const right = s.slice(colon + 1).trim();
    return { goal: left, realisedGoal: right };
  }
  return { goal: s, realisedGoal: '' };
}

const GOAL_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'achieved', label: 'Achieved' },
  { value: 'notMyGoal', label: 'Not my goal' },
];

function normaliseGoalStatus(row) {
  const s = row.goalStatus;
  if (s === 'achieved' || s === 'notMyGoal') return s;
  return 'active';
}

function goalStatusLabel(s) {
  if (s === 'achieved') return 'Achieved';
  if (s === 'notMyGoal') return 'Not my goal';
  return 'Active';
}

/** Include in footer totals only when still planning for this goal. */
function countsTowardTotals(row) {
  return normaliseGoalStatus(row) === 'active';
}

const GOAL_STATUS_SORT_ORDER = { active: 0, achieved: 1, notMyGoal: 2 };

function sortRows(rows, expectedCagrPct, planningStartYear) {
  if (!sortState.key || sortState.phase === 0) return rows;
  const dir = sortState.dir;
  const key = sortState.key;
  return rows
    .map((r, idx) => ({ r, idx }))
    .sort((a, b) => {
      let av;
      let bv;
      if (key === 'goalCombined') {
        av = formatCombinedGoal(a.r);
        bv = formatCombinedGoal(b.r);
      } else if (
        key === 'durationYears' ||
        key === 'valueAfterInflation' ||
        key === 'annualInvestment' ||
        key === 'monthlySip'
      ) {
        const da = computeGoalDerived(a.r, expectedCagrPct, planningStartYear);
        const db = computeGoalDerived(b.r, expectedCagrPct, planningStartYear);
        av = da[key];
        bv = db[key];
      } else if (key === 'goalStatus') {
        av = GOAL_STATUS_SORT_ORDER[normaliseGoalStatus(a.r)] ?? 0;
        bv = GOAL_STATUS_SORT_ORDER[normaliseGoalStatus(b.r)] ?? 0;
      } else {
        av = a.r[key];
        bv = b.r[key];
      }
      const aNum = Number(av);
      const bNum = Number(bv);
      const bothNum = Number.isFinite(aNum) && Number.isFinite(bNum);
      if (bothNum) {
        if (aNum < bNum) return -1 * dir;
        if (aNum > bNum) return 1 * dir;
      } else {
        const as = normalize(av);
        const bs = normalize(bv);
        if (as < bs) return -1 * dir;
        if (as > bs) return 1 * dir;
      }
      return a.idx - b.idx;
    })
    .map((x) => x.r);
}

function updateSortUi(table) {
  table.querySelectorAll('thead th[data-sort]').forEach((th) => {
    const k = th.getAttribute('data-sort');
    if (k && k === sortState.key && sortState.phase !== 0) {
      th.setAttribute('aria-sort', sortState.dir === 1 ? 'ascending' : 'descending');
    } else {
      th.setAttribute('aria-sort', 'none');
    }
  });
}

function ensureOption(options, v) {
  const s = String(v ?? '').trim();
  if (!s) return options;
  if (options.includes(s)) return options;
  return [...options, s];
}

/** Datalist options: built-in defaults first, then previously saved custom strings, then current row labels. */
function buildGoalOptions(defaultLabels, persistedList, rows) {
  let out = [];
  for (const s of defaultLabels) out = ensureOption(out, s);
  for (const s of persistedList) out = ensureOption(out, s);
  for (const r of rows) out = ensureOption(out, formatCombinedGoal(r));
  return out;
}

function render(controls, state) {
  if (!controls.cagr || !controls.tbody || !controls.table) return;

  const currentYear = new Date().getFullYear();
  const expectedCagrPct = Number(controls.cagr.value || state.expectedCagrPct);
  state.expectedCagrPct = Number.isFinite(expectedCagrPct) ? expectedCagrPct : state.expectedCagrPct;

  const pyRaw = Number.parseInt(String(controls.startYear?.value ?? ''), 10);
  state.planningStartYear = Number.isFinite(pyRaw) ? pyRaw : getGoalsDefaultPlanningStartYear();

  const sorted = sortRows(state.rows, state.expectedCagrPct, state.planningStartYear);
  updateSortUi(controls.table);

  controls.tbody.innerHTML = '';

  let sumValue = 0;
  let sumAnnual = 0;
  let sumMonthly = 0;

  sorted.forEach((row) => {
    const derived = computeGoalDerived(row, state.expectedCagrPct, state.planningStartYear);

    const tr = document.createElement('tr');
    const gs = normaliseGoalStatus(row);
    if (gs === 'achieved') tr.classList.add('row-achieved');
    if (gs === 'notMyGoal') tr.classList.add('row-not-my-goal');

    const combinedInput = document.createElement('input');
    combinedInput.value = formatCombinedGoal(row);
    combinedInput.className = 'filter-input';
    combinedInput.setAttribute('list', 'goals-goal-options');
    combinedInput.dataset.rowId = row.id;
    combinedInput.dataset.field = 'combinedGoal';
    combinedInput.title = 'Format: "Goal title": detail';

    const cost = document.createElement('input');
    cost.type = 'number';
    cost.step = '1';
    cost.value = String(row.costToday ?? 0);
    cost.className = 'filter-input';
    cost.dataset.rowId = row.id;
    cost.dataset.field = 'costToday';

    const year = document.createElement('input');
    year.type = 'number';
    year.step = '1';
    year.min = '2000';
    year.max = '2100';
    year.value = String(row.achieveByYear ?? currentYear);
    year.className = 'filter-input';
    year.dataset.rowId = row.id;
    year.dataset.field = 'achieveByYear';

    const infl = document.createElement('input');
    infl.type = 'number';
    infl.step = '0.1';
    infl.value = String(row.segmentInflationPct ?? 0);
    infl.className = 'filter-input';
    infl.dataset.rowId = row.id;
    infl.dataset.field = 'segmentInflationPct';

    const statusSel = document.createElement('select');
    statusSel.className = 'filter-select';
    statusSel.dataset.rowId = row.id;
    statusSel.dataset.field = 'goalStatus';
    const cur = normaliseGoalStatus(row);
    GOAL_STATUS_OPTIONS.forEach((o) => {
      const opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      if (cur === o.value) opt.selected = true;
      statusSel.appendChild(opt);
    });

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn';
    del.textContent = 'Delete';
    del.dataset.rowId = row.id;
    del.dataset.action = 'delete';

    function td(child, cls) {
      const tdEl = document.createElement('td');
      if (cls) tdEl.className = cls;
      if (child instanceof Node) tdEl.appendChild(child);
      else tdEl.textContent = String(child ?? '');
      return tdEl;
    }

    tr.appendChild(td(combinedInput));
    tr.appendChild(td(cost, 'num'));
    tr.appendChild(td(year, 'num'));
    tr.appendChild(td(infl, 'num'));
    tr.appendChild(td(String(derived.durationYears), 'num'));
    tr.appendChild(td(formatInr(derived.valueAfterInflation), 'num'));
    tr.appendChild(td(formatInr(derived.annualInvestment), 'num'));
    tr.appendChild(td(formatInr(derived.monthlySip), 'num'));
    tr.appendChild(td(statusSel));
    tr.appendChild(td(del));

    controls.tbody.appendChild(tr);

    if (countsTowardTotals(row)) {
      sumValue += derived.valueAfterInflation || 0;
      sumAnnual += derived.annualInvestment || 0;
      sumMonthly += derived.monthlySip || 0;
    }
  });

  controls.sumValue.textContent = formatInr(sumValue);
  controls.sumAnnual.textContent = formatInr(sumAnnual);
  controls.sumMonthly.textContent = formatInr(sumMonthly);

  saveGoalsRows(state.rows);
  saveExpectedCagrPct(state.expectedCagrPct);
  savePlanningStartYear(state.planningStartYear);

  state.goalOptions = buildGoalOptions(getDefaultGoalStrings(), state.goalOptions, sorted);
  saveOptions(GOALS_STORAGE_KEYS.goalOptions, state.goalOptions);
  controls.goalDatalist.innerHTML = state.goalOptions.map((o) => `<option value="${escapeHtml(o)}"></option>`).join('');
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function initGoalsTab() {
  if (initGoalsTab._didInit) return;
  const controls = {
    cagr: document.getElementById('goals-cagr'),
    startYear: document.getElementById('goals-start-year'),
    addRow: document.getElementById('goals-add-row'),
    exportCsv: document.getElementById('goals-export-csv'),
    print: document.getElementById('goals-print'),
    table: document.getElementById('goals-table'),
    tbody: document.getElementById('goals-tbody'),
    sumValue: document.getElementById('goals-sum-value'),
    sumAnnual: document.getElementById('goals-sum-annual'),
    sumMonthly: document.getElementById('goals-sum-monthly'),
    goalDatalist: null,
  };

  if (!controls.table || !controls.tbody || !controls.cagr || !controls.startYear) {
    console.error('Goals: missing required elements (table, tbody, cagr, or start year).');
    return;
  }

  const goalDatalist = document.createElement('datalist');
  goalDatalist.id = 'goals-goal-options';
  document.body.appendChild(goalDatalist);
  controls.goalDatalist = goalDatalist;

  const hadPlanningStartKey = localStorage.getItem(GOALS_STORAGE_KEYS.planningStartYear) != null;
  const loadedRows = loadGoalsRows();

  const planningStartYear = hadPlanningStartKey
    ? loadPlanningStartYear()
    : getGoalsDefaultPlanningStartYear();

  const state = {
    expectedCagrPct: loadExpectedCagrPct(10),
    planningStartYear,
    rows: loadedRows,
    goalOptions: loadOptions(GOALS_STORAGE_KEYS.goalOptions, []),
  };

  if (shouldUseDefaultGoals(state.rows)) state.rows = getDefaultGoalRows();
  if (!hadPlanningStartKey) savePlanningStartYear(state.planningStartYear);

  controls.cagr.value = String(state.expectedCagrPct);
  controls.startYear.value = String(state.planningStartYear);

  const onChange = () => render(controls, state);

  controls.cagr.addEventListener('input', onChange);
  controls.startYear.addEventListener('input', onChange);

  if (controls.addRow) {
    controls.addRow.addEventListener('click', () => {
      state.rows.push(newGoalRow());
      onChange();
    });
  }

  if (controls.exportCsv) {
    controls.exportCsv.addEventListener('click', () => {
      const visible = sortRows(state.rows, state.expectedCagrPct, state.planningStartYear);
      const lines = [
        ['Goal', 'CostToday', 'AchieveByYear', 'InflationPct', 'DurationYears', 'ValueAfterInflation', 'AnnualInvestment', 'MonthlySip', 'Status'],
      ];
      visible.forEach((r) => {
        const d = computeGoalDerived(r, state.expectedCagrPct, state.planningStartYear);
        lines.push([
          formatCombinedGoal(r),
          r.costToday,
          r.achieveByYear,
          r.segmentInflationPct,
          d.durationYears,
          Math.round(d.valueAfterInflation),
          Math.round(d.annualInvestment),
          Math.round(d.monthlySip),
          goalStatusLabel(normaliseGoalStatus(r)),
        ]);
      });
      const csv = lines.map((row) => row.map((c) => `"${String(c ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
      navigator.clipboard.writeText(csv);
    });
  }

  if (controls.print) {
    controls.print.addEventListener('click', () => globalThis.print());
  }

  controls.table.querySelectorAll('thead th[data-sort] .sort-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const th = btn.closest('th');
      const key = th ? th.getAttribute('data-sort') : null;
      if (!key) return;
      if (sortState.key !== key) {
        sortState.key = key;
        sortState.phase = 1;
        sortState.dir = 1;
      } else if (sortState.phase === 0) {
        sortState.phase = 1;
        sortState.dir = 1;
      } else if (sortState.phase === 1) {
        sortState.phase = 2;
        sortState.dir = -1;
      } else {
        sortState.phase = 0;
        sortState.dir = 1;
      }
      onChange();
    });
  });

  controls.tbody.addEventListener('input', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const rowId = t.dataset.rowId;
    const field = t.dataset.field;
    if (!rowId || !field) return;
    const row = state.rows.find((r) => r.id === rowId);
    if (!row) return;
    if (field === 'combinedGoal' && t instanceof HTMLInputElement) {
      const parsed = parseCombinedGoal(t.value);
      row.goal = parsed.goal;
      row.realisedGoal = parsed.realisedGoal;
      return;
    }
    if (field === 'goalStatus' && t instanceof HTMLSelectElement) {
      const v = t.value;
      row.goalStatus = v === 'achieved' || v === 'notMyGoal' ? v : 'active';
      return;
    }
    if (t instanceof HTMLInputElement && t.type === 'number') {
      const n = Number.parseFloat(t.value);
      if (field === 'costToday') row[field] = Number.isFinite(n) ? n : 0;
      else if (field === 'achieveByYear' || field === 'segmentInflationPct') {
        row[field] = Number.isFinite(n) ? n : 0;
      } else row[field] = t.value;
    } else if (t instanceof HTMLInputElement) row[field] = t.value;
    else if (t instanceof HTMLSelectElement) row[field] = t.value;
  });
  controls.tbody.addEventListener('change', (e) => {
    const t = e.target;
    if (t instanceof HTMLSelectElement && t.dataset.field === 'goalStatus' && t.dataset.rowId) {
      const row = state.rows.find((r) => r.id === t.dataset.rowId);
      if (row) {
        const v = t.value;
        row.goalStatus = v === 'achieved' || v === 'notMyGoal' ? v : 'active';
      }
    }
    onChange();
  });
  controls.tbody.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.dataset.action === 'delete' && t.dataset.rowId) {
      state.rows = state.rows.filter((r) => r.id !== t.dataset.rowId);
      if (!state.rows.length) state.rows = [newGoalRow()];
      onChange();
    }
  });

  initGoalsTab._didInit = true;
  onChange();
}

initGoalsTab._didInit = false;
