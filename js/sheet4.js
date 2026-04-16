/**
 * Sheet4 FIRE calculator — parity with Excel "Sheet4" formulas.
 * Share URL: plain query params (monthlyExpense, yearsToRetirement, startYear, inflationPct, expectedCagrPct) — no encoding.
 * Custom-row CAGR (a22) is not shared; when opening a shared URL, a22 defaults to f7.
 * Legacy #v1... hash links still decode on first load for backwards compatibility.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'fire-sheet4-v1';
  const HASH_PREFIX = 'v1';

  /**
   * Share URL params (human readable) + aliases for older links.
   * Internal keys match the Excel-ish names used in this app.
   */
  const SHARE_PARAM_CONFIG = {
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

  const DEFAULTS = {
    c2: 100000,
    f2: 10,
    c4: 2024,
    f4: 6,
    f7: 10,
    a22: 10,
  };

  const SWR_RATES = [2, 2.5, 3, 3.5, 4, 5];

  /** Short definitions for each FIRE row (matches how this sheet computes the column). */
  const FIRE_TYPE_DEFINITIONS = {
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
    fat:
      'Fat FIRE allows high discretionary spending. Here: 3 × the standard FIRE corpus.',
    obese:
      'Obese FIRE is a very large spending cushion. Here: 5 × the standard FIRE corpus.',
    safe35:
      'Uses a stricter 3.5% withdrawal assumption instead of 4%. The corpus equals the 3.5% row (E18) in the SWR table.',
    safe3:
      'Uses a 3% withdrawal assumption (common for extra safety). The corpus equals the 3% row (E17) in the SWR table.',
  };

  const INFO_ICON_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';

  /** Excel ROUND to 0 decimals — C7/C8 are always positive; Math.round matches Excel here. */
  function excelRound(n) {
    return Math.round(n);
  }

  function pow1p(percent, years) {
    return Math.pow(1 + percent / 100, years);
  }

  function compute(inputs) {
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
    if (isFinite(b23) && b23 > 0) {
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
      j4,
      j5,
      j6,
      j7,
      j8,
      j9,
      j10,
      j11,
      j12,
      custom,
    };
  }

  /**
   * Largest sensible Indian unit, up to 2 decimal places (trailing zeros trimmed).
   * Cr (≥1e7), lakhs (≥1e5), thousand (≥1e3), else plain amount.
   */
  function formatApproxInr(n) {
    const v = Math.abs(Number(n));
    if (!isFinite(v)) return '';
    if (v === 0) return '0';

    function fmt2trim(x) {
      let s = x.toFixed(2);
      if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
      return s;
    }

    if (v >= 1e7) return fmt2trim(v / 1e7) + ' Cr';
    if (v >= 1e5) return fmt2trim(v / 1e5) + ' lakhs';
    if (v >= 1e3) return fmt2trim(v / 1e3) + ' thousand';
    return fmt2trim(v);
  }

  /** Table display: prefix ≈ ; em dash for non-positive / invalid. */
  function formatApproxDisplay(n) {
    if (!isFinite(n) || n <= 0) return '—';
    return '≈ ' + formatApproxInr(n);
  }

  function formatInr(n) {
    const x = Math.round(Number(n));
    return x.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  /** Legacy decode for old shared hash links (#v1...). */
  function decodeHash(str) {
    if (!str || typeof str !== 'string') return null;
    const s = str.replace(/^#/, '');
    if (!s.startsWith(HASH_PREFIX)) return null;
    let b64 = s.slice(HASH_PREFIX.length).replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    if (pad) b64 += '='.repeat(4 - pad);
    try {
      const bin = atob(b64);
      if (bin.length !== 40 && bin.length !== 48) return null;
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const floats = new Float64Array(bytes.buffer);
      const out = {
        c2: floats[0],
        f2: floats[1],
        c4: floats[2],
        f4: floats[3],
        f7: floats[4],
      };
      if (bin.length === 48) {
        out.a22 = floats[5];
      }
      return out;
    } catch {
      return null;
    }
  }

  function encodeQuery(inputs) {
    const s = sanitizeInputs(inputs);
    const qs = new URLSearchParams();
    qs.set(SHARE_PARAM_CONFIG.c2.name, String(s.c2));
    qs.set(SHARE_PARAM_CONFIG.f2.name, String(s.f2));
    qs.set(SHARE_PARAM_CONFIG.c4.name, String(s.c4));
    qs.set(SHARE_PARAM_CONFIG.f4.name, String(s.f4));
    qs.set(SHARE_PARAM_CONFIG.f7.name, String(s.f7));
    return qs.toString();
  }

  function getQueryParam(qs, cfg) {
    if (qs.has(cfg.name)) return qs.get(cfg.name);
    for (const a of cfg.aliases || []) {
      if (qs.has(a)) return qs.get(a);
    }
    return null;
  }

  function decodeQuery() {
    const qs = new URLSearchParams(window.location.search);
    const c2 = getQueryParam(qs, SHARE_PARAM_CONFIG.c2);
    const f2 = getQueryParam(qs, SHARE_PARAM_CONFIG.f2);
    const c4 = getQueryParam(qs, SHARE_PARAM_CONFIG.c4);
    const f4 = getQueryParam(qs, SHARE_PARAM_CONFIG.f4);
    const f7 = getQueryParam(qs, SHARE_PARAM_CONFIG.f7);
    const hasAny = c2 !== null || f2 !== null || c4 !== null || f4 !== null || f7 !== null;
    if (!hasAny) return null;
    const parsed = {
      c2,
      f2,
      c4,
      f4,
      f7,
    };
    return sanitizeInputs(parsed);
  }

  function sanitizeInputs(raw) {
    const d = { ...DEFAULTS, ...raw };
    const c2 = Math.max(0, Math.round(d.c2));
    const f2 = Math.max(0, Math.min(80, Number(d.f2)));
    const c4 = Math.max(1900, Math.min(2200, Math.round(d.c4)));
    const f4 = Math.max(-50, Math.min(50, Number(d.f4)));
    const f7 = Math.max(-50, Math.min(50, Number(d.f7)));
    const a22 = Math.max(-50, Math.min(50, Number(d.a22)));
    return { c2, f2, c4, f4, f7, a22 };
  }

  function readForm() {
    const el = (id) => document.getElementById(id);
    return sanitizeInputs({
      c2: parseFloat(el('in-c2').value),
      f2: parseFloat(el('in-f2').value),
      c4: parseFloat(el('in-c4').value),
      f4: parseFloat(el('in-f4').value),
      f7: parseFloat(el('in-f7').value),
      a22: parseFloat(el('in-a22').value),
    });
  }

  function writeForm(inputs) {
    const el = (id) => document.getElementById(id);
    const i = sanitizeInputs(inputs);
    el('in-c2').value = i.c2;
    el('in-f2').value = i.f2;
    el('in-c4').value = i.c4;
    el('in-f4').value = i.f4;
    el('in-f7').value = i.f7;
    el('in-a22').value = i.a22;
    return i;
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
    const el = (id) => document.getElementById(id);
    el('out-c3').textContent = formatInr(data.c3);
    el('out-c5').textContent = String(Math.round(data.c5));
    el('out-c7').textContent = formatInr(data.c7);
    el('out-c8').textContent = formatInr(data.c8);

    const tbody = document.getElementById('fire-tbody');
    tbody.innerHTML = '';
    data.fireRows.forEach((row) => {
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

    const swrBody = document.getElementById('swr-tbody');
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

    const note = document.getElementById('std-fire-note');
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

  function updateUrlQuery(inputs) {
    const query = encodeQuery(inputs);
    const base = window.location.pathname;
    const next = query ? base + '?' + query : base;
    if (history.replaceState) {
      history.replaceState(null, '', next);
    }
  }

  function loadFromUrl() {
    const fromQuery = decodeQuery();
    if (fromQuery) {
      return sanitizeInputs({ ...fromQuery, a22: fromQuery.f7 });
    }

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
    if (window.location.hash) window.location.hash = '';
    return s;
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return sanitizeInputs(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  function saveToStorage(inputs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeInputs(inputs)));
    } catch (_) {}
  }

  function recalc() {
    const inputs = readForm();
    const data = compute(inputs);
    applyResults(data);
    saveToStorage(inputs);
    updateUrlQuery(inputs);
    const linkEl = document.getElementById('share-link');
    if (linkEl) linkEl.value = window.location.href;
  }

  function init() {
    const fromStore = loadFromStorage();
    const fromUrl = loadFromUrl();
    const initial = fromUrl || fromStore || DEFAULTS;
    writeForm(initial);

    ['in-c2', 'in-f2', 'in-c4', 'in-f4', 'in-f7', 'in-a22'].forEach((id) => {
      const n = document.getElementById(id);
      n.addEventListener('input', recalc);
      n.addEventListener('change', recalc);
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      writeForm(DEFAULTS);
      recalc();
    });

    document.getElementById('btn-copy-url').addEventListener('click', () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(
        () => {
          const b = document.getElementById('btn-copy-url');
          const t = b.textContent;
          b.textContent = 'Copied';
          setTimeout(() => {
            b.textContent = t;
          }, 1500);
        },
        () => {}
      );
    });

    document.getElementById('btn-copy-csv').addEventListener('click', () => {
      const data = compute(readForm());
      const lines = [['SWR %', 'Multiplier', 'Annual expense', 'Corpus (₹)', 'Approx. (Cr/lakhs/…)']];
      data.swrRows.forEach((r) => {
        lines.push([
          String(r.swr),
          String(r.mult),
          String(r.annualExpense),
          String(Math.round(r.corpus)),
          formatApproxInr(r.corpus),
        ]);
      });
      const csv = lines.map((row) => row.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
      navigator.clipboard.writeText(csv).then(
        () => {
          const b = document.getElementById('btn-copy-csv');
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
      const btn = document.getElementById('btn-theme');
      if (btn) btn.setAttribute('aria-pressed', mode === 'dark' ? 'true' : 'false');
    }
    if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      applyTheme('dark');
    }
    document.getElementById('btn-theme').addEventListener('click', () => {
      const dark = root.getAttribute('data-theme') === 'dark';
      applyTheme(dark ? 'light' : 'dark');
    });

    recalc();
    const share = document.getElementById('share-link');
    if (share) share.value = window.location.href;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
