import { INITIAL_GOALS } from './initialGoalsData.js';
import { newGoalRow } from './state.js';

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
 * Built-in sample goals (ids + `achieved: false`).
 */
export function getDefaultGoalRows() {
  return INITIAL_GOALS.map((r) =>
    newGoalRow({
      goal: r.goal,
      realisedGoal: r.realisedGoal,
      costToday: r.costToday,
      needDesire: r.needDesire,
      priority: r.priority,
      achieveByYear: r.achieveByYear,
      segmentInflationPct: r.segmentInflationPct,
      achieved: false,
    }),
  );
}
