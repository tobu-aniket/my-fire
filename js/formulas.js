import { SWR_RATES } from './constants.js';

/** Excel ROUND to 0 decimals — C7/C8 are always positive; Math.round matches Excel here. */
function excelRound(n) {
  return Math.round(n);
}

function pow1p(percent, years) {
  return Math.pow(1 + percent / 100, years);
}

export function compute(inputs) {
  const c2 = Number(inputs.c2);
  const f2 = Number(inputs.f2);
  const c4 = Number(inputs.c4);
  const f4 = Number(inputs.f4);
  const f7 = Number(inputs.f7);
  const a22 = Number(inputs.a22);

  const c3 = c2 * 12;
  const c5 = c4 + f2;
  const c7 = excelRound(c2 * pow1p(f4, f2));
  const c8 = excelRound(c3 * pow1p(f4, f2));

  const swrRows = SWR_RATES.map((b) => {
    const c = 100 / b;
    const d = c8;
    const e = d * c;
    return { swr: b, mult: c, annualExpense: d, corpus: e };
  });

  const e19 = swrRows[4].corpus;
  const e18 = swrRows[3].corpus;
  const e17 = swrRows[2].corpus;

  const j7 = e19;
  const j4 = 0.75 * j7;
  const j5 = j7 / 2;
  const j6 = j7 / pow1p(f7, f2);
  const j8 = 1.75 * j7;
  const j9 = 3 * j7;
  const j10 = 5 * j7;
  const j11 = e18;
  const j12 = e17;

  const fireRows = [
    { key: 'lean', label: 'Lean FIRE', formula: '0.75 × F', j: j4 },
    { key: 'barista', label: 'Barista FIRE', formula: 'F / 2', j: j5 },
    { key: 'coast', label: 'Coast FIRE', formula: 'F / (1+r)^n', j: j6 },
    { key: 'standard', label: 'Standard FIRE', formula: 'F', j: j7 },
    { key: 'chubby', label: 'Chubby FIRE', formula: '1.75 × F', j: j8 },
    { key: 'fat', label: 'Fat FIRE', formula: '3 × F', j: j9 },
    { key: 'obese', label: 'Obese FIRE', formula: '5 × F', j: j10 },
    { key: 'safe35', label: 'Safe FIRE (3.5%)', formula: 'cell E18', j: j11 },
    { key: 'safe3', label: 'Safe FIRE (3%)', formula: 'cell E17', j: j12 },
  ];

  const b23 = a22 - f4;
  let custom = null;
  if (Number.isFinite(b23) && b23 > 0) {
    const c23 = 100 / b23;
    const d23 = c8;
    const e23 = d23 * c23;
    custom = {
      b23,
      c23,
      d23,
      e23,
      valid: true,
    };
  } else {
    custom = { b23, valid: false };
  }

  return {
    inputs: { c2, f2, c4, f4, f7, a22 },
    c3,
    c5,
    c7,
    c8,
    swrRows,
    fireRows,
    custom,
  };
}

