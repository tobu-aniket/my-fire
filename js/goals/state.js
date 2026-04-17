import { getGoalsDefaultPlanningStartYear, GOALS_STORAGE_KEYS } from '../constants.js';

/** Previous key before v2; read once for migration, removed on save. */
const LEGACY_GOALS_ROWS_KEY = 'goals_rows_v1';

function safeParseJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/** @param {Record<string, unknown>} [overrides] */
export function newGoalRow(overrides) {
  const base = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2),
    goal: '',
    realisedGoal: '',
    costToday: 0,
    achieveByYear: new Date().getFullYear() + 5,
    segmentInflationPct: 6,
    goalStatus: 'active',
  };
  return overrides ? { ...base, ...overrides } : base;
}

function normalizeLoadedRow(r) {
  if (!r || typeof r !== 'object') return r;
  const row = { ...r };
  if (row.realisedGoal === undefined) row.realisedGoal = '';
  delete row.needDesire;
  delete row.priority;
  if (row.goalStatus === undefined) {
    if (row.achieved === true) row.goalStatus = 'achieved';
    else row.goalStatus = 'active';
  }
  delete row.achieved;
  if (row.goalStatus !== 'active' && row.goalStatus !== 'achieved' && row.goalStatus !== 'notMyGoal') {
    row.goalStatus = 'active';
  }
  return row;
}

export function loadGoalsRows() {
  let raw = null;
  try {
    raw = localStorage.getItem(GOALS_STORAGE_KEYS.rows);
    if (raw == null) {
      raw = localStorage.getItem(LEGACY_GOALS_ROWS_KEY);
    }
  } catch {
    return [];
  }
  if (raw == null) return [];
  const data = safeParseJson(raw);
  if (!Array.isArray(data)) return [];
  return data.map((r) => normalizeLoadedRow(r));
}

export function saveGoalsRows(rows) {
  try {
    localStorage.setItem(GOALS_STORAGE_KEYS.rows, JSON.stringify(rows));
    localStorage.removeItem(LEGACY_GOALS_ROWS_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadExpectedCagrPct(defaultValue = 10) {
  let raw = null;
  try {
    raw = localStorage.getItem(GOALS_STORAGE_KEYS.expectedCagrPct);
  } catch {
    return defaultValue;
  }
  const v = raw == null ? defaultValue : Number(raw);
  return Number.isFinite(v) ? v : defaultValue;
}

export function saveExpectedCagrPct(v) {
  try {
    localStorage.setItem(GOALS_STORAGE_KEYS.expectedCagrPct, String(v));
  } catch {
    /* ignore */
  }
}

export function loadPlanningStartYear(defaultValue = getGoalsDefaultPlanningStartYear()) {
  let raw = null;
  try {
    raw = localStorage.getItem(GOALS_STORAGE_KEYS.planningStartYear);
  } catch {
    return defaultValue;
  }
  const v = raw == null ? defaultValue : Number.parseInt(String(raw), 10);
  return Number.isFinite(v) ? v : defaultValue;
}

export function savePlanningStartYear(v) {
  try {
    localStorage.setItem(GOALS_STORAGE_KEYS.planningStartYear, String(v));
  } catch {
    /* ignore */
  }
}

export function loadOptions(key, fallback = []) {
  let raw = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return fallback.slice();
  }
  if (!raw) return fallback.slice();
  const data = safeParseJson(raw);
  return Array.isArray(data) ? data : fallback.slice();
}

export function saveOptions(key, options) {
  try {
    localStorage.setItem(key, JSON.stringify(options));
  } catch {
    /* ignore */
  }
}

