import { INITIAL_GOALS } from './initialGoalsData.js';
import { newGoalRow } from './state.js';

/** Same display string as the Goal column for a row-shaped object (matches `formatCombinedGoal` in ui.js). */
function combinedGoalLabel(row) {
  const g = String(row.goal ?? '').trim();
  const r = String(row.realisedGoal ?? '').trim();
  if (g && r) return `"${g}": ${r}`;
  if (g) return g;
  return r;
}

/** Labels for built-in sample goals — used to seed the Goal field datalist. */
export function getDefaultGoalStrings() {
  return INITIAL_GOALS.map((row) => combinedGoalLabel(row)).filter((s) => s.length > 0);
}

function isBlankStarterRow(r) {
  if (!r || typeof r !== 'object') return false;
  const goal = String(r.goal ?? '').trim();
  const realised = String(r.realisedGoal ?? '').trim();
  const cost = Number(r.costToday);
  return goal === '' && realised === '' && (!Number.isFinite(cost) || cost === 0);
}

/**
 * True when we should load built-in samples: nothing saved, or only placeholder rows
 * (empty goal, empty realised, zero cost).
 * @param {unknown[]} rows
 */
export function shouldUseDefaultGoals(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return true;
  return rows.every(isBlankStarterRow);
}

/**
 * Built-in sample goals (ids + active status).
 */
export function getDefaultGoalRows() {
  return INITIAL_GOALS.map((r) =>
    newGoalRow({
      goal: r.goal,
      costToday: r.costToday,
      achieveByYear: r.achieveByYear,
      segmentInflationPct: r.segmentInflationPct,
      goalStatus: 'active',
    }),
  );
}
