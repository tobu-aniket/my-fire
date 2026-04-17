export const STORAGE_KEY = 'fire-sheet4-v1';
export const HASH_PREFIX = 'v1';

/**
 * Share URL params (human readable) + aliases for older links.
 * Internal keys match the Excel-ish names used in this app.
 */
export const SHARE_PARAM_CONFIG = {
  c2: {
    name: 'monthlyExpense',
    aliases: ['c2', 'me'],
  },
  f2: {
    name: 'yearsToRetirement',
    aliases: ['f2', 'years', 'ytr'],
  },
  c4: {
    name: 'startYear',
    aliases: ['c4', 'sy'],
  },
  f4: {
    name: 'inflationPct',
    aliases: ['f4', 'inflation', 'inf'],
  },
  f7: {
    name: 'expectedCagrPct',
    aliases: ['f7', 'cagr', 'expCagr'],
  },
};

export const DEFAULTS = {
  c2: 100000,
  f2: 10,
  c4: 2024,
  f4: 6,
  f7: 10,
  a22: 10,
};

export const SWR_RATES = [2, 2.5, 3, 3.5, 4, 5];

/** Short definitions for each FIRE row (matches how this sheet computes the column). */
export const FIRE_TYPE_DEFINITIONS = {
  lean:
    'Lean FIRE targets a smaller lifestyle than “standard” retirement. Here the corpus is 0.75 × F, where F is the standard FIRE number (4% withdrawal row).',
  barista:
    'Barista FIRE assumes part-time or lower-stress work still covers part of expenses. This sheet uses half of the standard FIRE corpus: F ÷ 2.',
  coast:
    'Coast FIRE means you invest until growth is enough to reach the goal without new contributions. This row uses F ÷ (1+r)^n with your expected CAGR r and years n to retirement.',
  standard:
    'Standard FIRE is the baseline “fully retired” corpus F from the 4% safe-withdrawal row (E19 in the workbook table).',
  chubby:
    'Chubby FIRE adds comfort above standard. Here: 1.75 × the standard FIRE corpus.',
  fat: 'Fat FIRE allows high discretionary spending. Here: 3 × the standard FIRE corpus.',
  obese: 'Obese FIRE is a very large spending cushion. Here: 5 × the standard FIRE corpus.',
  safe35:
    'Uses a stricter 3.5% withdrawal assumption instead of 4%. Starting from F (4% corpus), this sheet computes it as F × 4 ÷ 3.5.',
  safe3:
    'Uses a 3% withdrawal assumption (common for extra safety). Starting from F (4% corpus), this sheet computes it as F × 4 ÷ 3.',
};

export const INFO_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';

// Goals tab
export const GOALS_STORAGE_KEYS = {
  /** v2: bump so a fresh 17-row seed applies; v1 had many stuck partial/empty states. */
  rows: 'goals_rows_v2',
  expectedCagrPct: 'goals_expectedCagrPct_v1',
  planningStartYear: 'goals_planningStartYear_v1',
  goalOptions: 'goals_goalOptions_v1',
  realisedOptions: 'goals_realisedOptions_v1',
};

/** Baseline year for duration when none is saved (calendar year). */
export function getGoalsDefaultPlanningStartYear() {
  return new Date().getFullYear();
}

export const GOALS_ENUMS = {
  needDesire: ['Need', 'Desire'],
  priority: ['High', 'Medium', 'Low'],
};

