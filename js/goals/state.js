import { GOALS_STORAGE_KEYS } from '../constants.js';

function safeParseJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export function newGoalRow() {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2),
    goal: '',
    realisedGoal: '',
    costToday: 0,
    needDesire: 'Need',
    priority: 'Medium',
    achieveByYear: new Date().getFullYear() + 5,
    segmentInflationPct: 6,
    achieved: false,
  };
}

export function loadGoalsRows() {
  const raw = localStorage.getItem(GOALS_STORAGE_KEYS.rows);
  if (!raw) return [];
  const data = safeParseJson(raw);
  return Array.isArray(data) ? data : [];
}

export function saveGoalsRows(rows) {
  localStorage.setItem(GOALS_STORAGE_KEYS.rows, JSON.stringify(rows));
}

export function loadExpectedCagrPct(defaultValue = 10) {
  const raw = localStorage.getItem(GOALS_STORAGE_KEYS.expectedCagrPct);
  const v = raw == null ? defaultValue : Number(raw);
  return Number.isFinite(v) ? v : defaultValue;
}

export function saveExpectedCagrPct(v) {
  localStorage.setItem(GOALS_STORAGE_KEYS.expectedCagrPct, String(v));
}

export function loadOptions(key, fallback = []) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback.slice();
  const data = safeParseJson(raw);
  return Array.isArray(data) ? data : fallback.slice();
}

export function saveOptions(key, options) {
  localStorage.setItem(key, JSON.stringify(options));
}

