import { getGoalsDefaultPlanningStartYear, GOALS_ENUMS, GOALS_STORAGE_KEYS } from '../constants.js';
import { formatInr } from '../utils.js';
import { getDefaultGoalRows, shouldUseDefaultGoals } from './defaultRows.js';
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

function getFilterValue(container, key) {
  const node = container.querySelector(`[data-filter=\"${key}\"]`);
  if (!node) return '';
  if (node.tagName === 'SELECT') return node.value;
  return node.value || '';
}

function applyFilters(rows, controls) {
  const filterRow = controls.table.querySelector('thead .filter-row');

  return rows.filter((r) => {
    if (filterRow) {
      const goalF = normalize(getFilterValue(filterRow, 'goal'));
      if (goalF && !normalize(r.goal).includes(goalF)) return false;
      const realisedF = normalize(getFilterValue(filterRow, 'realisedGoal'));
      if (realisedF && !normalize(r.realisedGoal).includes(realisedF)) return false;

      const costF = normalize(getFilterValue(filterRow, 'costToday'));
      if (costF && !String(r.costToday).includes(costF)) return false;

      const nd = getFilterValue(filterRow, 'needDesire');
      if (nd && r.needDesire !== nd) return false;

      const pr = getFilterValue(filterRow, 'priority');
      if (pr && r.priority !== pr) return false;

      const yearF = normalize(getFilterValue(filterRow, 'achieveByYear'));
      if (yearF && !String(r.achieveByYear).includes(yearF)) return false;

      const infF = normalize(getFilterValue(filterRow, 'segmentInflationPct'));
      if (infF && !String(r.segmentInflationPct).includes(infF)) return false;

      const ach = getFilterValue(filterRow, 'achieved');
      if (ach === 'true' && !r.achieved) return false;
      if (ach === 'false' && r.achieved) return false;
    }

    return true;
  });
}

function sortRows(rows) {
  if (!sortState.key || sortState.phase === 0) return rows;
  const dir = sortState.dir;
  const key = sortState.key;
  return rows
    .map((r, idx) => ({ r, idx }))
    .sort((a, b) => {
      const av = a.r[key];
      const bv = b.r[key];
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

function render(controls, state) {
  if (!controls.cagr || !controls.tbody || !controls.table) return;

  const currentYear = new Date().getFullYear();
  const expectedCagrPct = Number(controls.cagr.value || state.expectedCagrPct);
  state.expectedCagrPct = Number.isFinite(expectedCagrPct) ? expectedCagrPct : state.expectedCagrPct;

  const pyRaw = Number.parseInt(String(controls.startYear?.value ?? ''), 10);
  state.planningStartYear = Number.isFinite(pyRaw) ? pyRaw : getGoalsDefaultPlanningStartYear();

  const filtered = applyFilters(state.rows, controls);
  const sorted = sortRows(filtered);
  updateSortUi(controls.table);

  controls.tbody.innerHTML = '';

  let sumValue = 0;
  let sumAnnual = 0;
  let sumMonthly = 0;

  sorted.forEach((row) => {
    const derived = computeGoalDerived(row, state.expectedCagrPct, state.planningStartYear);

    const tr = document.createElement('tr');
    if (row.achieved) tr.classList.add('row-achieved');

    const goalInput = document.createElement('input');
    goalInput.value = row.goal;
    goalInput.className = 'filter-input';
    goalInput.setAttribute('list', 'goals-goal-options');
    goalInput.dataset.rowId = row.id;
    goalInput.dataset.field = 'goal';

    const realisedInput = document.createElement('input');
    realisedInput.value = row.realisedGoal ?? '';
    realisedInput.className = 'filter-input';
    realisedInput.setAttribute('list', 'goals-realised-options');
    realisedInput.dataset.rowId = row.id;
    realisedInput.dataset.field = 'realisedGoal';

    const cost = document.createElement('input');
    cost.type = 'number';
    cost.step = '1';
    cost.value = String(row.costToday ?? 0);
    cost.className = 'filter-input';
    cost.dataset.rowId = row.id;
    cost.dataset.field = 'costToday';

    const nd = document.createElement('select');
    nd.className = 'filter-select';
    GOALS_ENUMS.needDesire.forEach((o) => {
      const opt = document.createElement('option');
      opt.value = o;
      opt.textContent = o;
      if (row.needDesire === o) opt.selected = true;
      nd.appendChild(opt);
    });
    nd.dataset.rowId = row.id;
    nd.dataset.field = 'needDesire';

    const pr = document.createElement('select');
    pr.className = 'filter-select';
    GOALS_ENUMS.priority.forEach((o) => {
      const opt = document.createElement('option');
      opt.value = o;
      opt.textContent = o;
      if (row.priority === o) opt.selected = true;
      pr.appendChild(opt);
    });
    pr.dataset.rowId = row.id;
    pr.dataset.field = 'priority';

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

    const achieved = document.createElement('input');
    achieved.type = 'checkbox';
    achieved.checked = !!row.achieved;
    achieved.dataset.rowId = row.id;
    achieved.dataset.field = 'achieved';

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn';
    del.textContent = 'Delete';
    del.dataset.rowId = row.id;
    del.dataset.action = 'delete';

    function td(child, cls) {
      const td = document.createElement('td');
      if (cls) td.className = cls;
      if (child instanceof Node) td.appendChild(child);
      else td.textContent = String(child ?? '');
      return td;
    }

    tr.appendChild(td(goalInput));
    tr.appendChild(td(realisedInput));
    tr.appendChild(td(cost, 'num'));
    tr.appendChild(td(nd));
    tr.appendChild(td(pr));
    tr.appendChild(td(year, 'num'));
    tr.appendChild(td(infl, 'num'));
    tr.appendChild(td(String(derived.durationYears), 'num'));
    tr.appendChild(td(formatInr(derived.valueAfterInflation), 'num'));
    tr.appendChild(td(formatInr(derived.annualInvestment), 'num'));
    tr.appendChild(td(formatInr(derived.monthlySip), 'num'));
    tr.appendChild(td(achieved));
    tr.appendChild(td(del));

    controls.tbody.appendChild(tr);

    if (!row.achieved) {
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

  // Update option lists from current content
  state.goalOptions = sorted.reduce((opts, r) => ensureOption(opts, r.goal), state.goalOptions);
  state.realisedOptions = sorted.reduce((opts, r) => ensureOption(opts, r.realisedGoal), state.realisedOptions);
  saveOptions(GOALS_STORAGE_KEYS.goalOptions, state.goalOptions);
  saveOptions(GOALS_STORAGE_KEYS.realisedOptions, state.realisedOptions);
  controls.goalDatalist.innerHTML = state.goalOptions.map((o) => `<option value="${escapeHtml(o)}"></option>`).join('');
  controls.realisedDatalist.innerHTML = state.realisedOptions.map((o) => `<option value="${escapeHtml(o)}"></option>`).join('');
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
    realisedDatalist: null,
  };

  if (!controls.table || !controls.tbody || !controls.cagr || !controls.startYear) {
    console.error('Goals: missing required elements (table, tbody, cagr, or start year).');
    return;
  }

  const goalDatalist = document.createElement('datalist');
  goalDatalist.id = 'goals-goal-options';
  const realisedDatalist = document.createElement('datalist');
  realisedDatalist.id = 'goals-realised-options';
  document.body.appendChild(goalDatalist);
  document.body.appendChild(realisedDatalist);
  controls.goalDatalist = goalDatalist;
  controls.realisedDatalist = realisedDatalist;

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
    realisedOptions: loadOptions(GOALS_STORAGE_KEYS.realisedOptions, []),
  };

  if (shouldUseDefaultGoals(state.rows)) state.rows = getDefaultGoalRows();
  if (!hadPlanningStartKey) savePlanningStartYear(state.planningStartYear);

  controls.cagr.value = String(state.expectedCagrPct);
  controls.startYear.value = String(state.planningStartYear);

  const onChange = () => render(controls, state);

  controls.cagr.addEventListener('input', onChange);
  controls.startYear.addEventListener('input', onChange);
  controls.table.querySelectorAll('thead .filter-row .filter-input, thead .filter-row .filter-select').forEach((n) => {
    n.addEventListener('input', onChange);
    n.addEventListener('change', onChange);
  });

  if (controls.addRow) {
    controls.addRow.addEventListener('click', () => {
      state.rows.push(newGoalRow());
      onChange();
    });
  }

  if (controls.exportCsv) {
    controls.exportCsv.addEventListener('click', () => {
      const visible = sortRows(applyFilters(state.rows, controls));
      const lines = [
        ['Goal', 'Realised', 'CostToday', 'NeedDesire', 'Priority', 'AchieveByYear', 'InflationPct', 'DurationYears', 'ValueAfterInflation', 'AnnualInvestment', 'MonthlySip', 'Achieved'],
      ];
      visible.forEach((r) => {
        const d = computeGoalDerived(r, state.expectedCagrPct, state.planningStartYear);
        lines.push([
          r.goal,
          r.realisedGoal,
          r.costToday,
          r.needDesire,
          r.priority,
          r.achieveByYear,
          r.segmentInflationPct,
          d.durationYears,
          Math.round(d.valueAfterInflation),
          Math.round(d.annualInvestment),
          Math.round(d.monthlySip),
          r.achieved,
        ]);
      });
      const csv = lines.map((row) => row.map((c) => `"${String(c ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
      navigator.clipboard.writeText(csv);
    });
  }

  if (controls.print) {
    controls.print.addEventListener('click', () => globalThis.print());
  }

  // Sorting
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

  // Editable table changes (event delegation)
  controls.tbody.addEventListener('input', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const rowId = t.dataset.rowId;
    const field = t.dataset.field;
    if (!rowId || !field) return;
    const row = state.rows.find((r) => r.id === rowId);
    if (!row) return;
    if (t instanceof HTMLInputElement && t.type === 'checkbox') row[field] = t.checked;
    else if (t instanceof HTMLInputElement && t.type === 'number') {
      const n = Number.parseFloat(t.value);
      if (field === 'costToday') row[field] = Number.isFinite(n) ? n : 0;
      else if (field === 'achieveByYear' || field === 'segmentInflationPct') {
        row[field] = Number.isFinite(n) ? n : 0;
      } else row[field] = t.value;
    } else if (t instanceof HTMLInputElement) row[field] = t.value;
    else if (t instanceof HTMLSelectElement) row[field] = t.value;
  });
  controls.tbody.addEventListener('change', onChange);
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

