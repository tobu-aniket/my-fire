/**
 * Goals formulas (annual compounding) with Excel-compatible FV/PMT behavior.
 */

/**
 * Excel-like FV.
 * @param {number} rate
 * @param {number} nper
 * @param {number} pmt
 * @param {number} pv
 * @param {0|1} [type] 0=end, 1=begin
 */
export function fv(rate, nper, pmt, pv, type = 0) {
  const r = Number(rate);
  const n = Number(nper);
  const P = Number(pmt);
  const PV = Number(pv);
  if (!Number.isFinite(r) || !Number.isFinite(n) || !Number.isFinite(P) || !Number.isFinite(PV)) return Number.NaN;
  if (n === 0) return -PV;
  if (r === 0) return -(PV + P * n);
  const pow = Math.pow(1 + r, n);
  return -(PV * pow + P * (1 + r * type) * ((pow - 1) / r));
}

/**
 * Excel-like PMT.
 * @param {number} rate
 * @param {number} nper
 * @param {number} pv
 * @param {number} [fvVal]
 * @param {0|1} [type]
 */
export function pmt(rate, nper, pv, fvVal = 0, type = 0) {
  const r = Number(rate);
  const n = Number(nper);
  const PV = Number(pv);
  const FV = Number(fvVal);
  if (!Number.isFinite(r) || !Number.isFinite(n) || !Number.isFinite(PV) || !Number.isFinite(FV)) return Number.NaN;
  if (n === 0) return Number.NaN;
  if (r === 0) return -(PV + FV) / n;
  const pow = Math.pow(1 + r, n);
  return -(PV * pow + FV) / ((1 + r * type) * ((pow - 1) / r));
}

/**
 * @param {number} achieveByYear
 * @param {number} currentYear
 */
export function durationYears(achieveByYear, currentYear) {
  const d = Number(achieveByYear) - Number(currentYear);
  if (!Number.isFinite(d)) return 0;
  return Math.max(0, Math.round(d));
}

export function computeGoalDerived(row, expectedCagrPct, currentYear) {
  const dur = durationYears(row.achieveByYear, currentYear);
  const inflRate = Number(row.segmentInflationPct) / 100;
  const cagrRate = Number(expectedCagrPct) / 100;

  const valueAfterInflation = fv(inflRate, dur, 0, -Number(row.costToday), 0);
  const annualInvestment = pmt(cagrRate, dur, 0, -valueAfterInflation, 0);
  const monthlySip = annualInvestment / 12;

  return {
    durationYears: dur,
    valueAfterInflation,
    annualInvestment,
    monthlySip,
  };
}

