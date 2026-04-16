import { DEFAULTS, HASH_PREFIX, SHARE_PARAM_CONFIG, STORAGE_KEY } from './constants.js';

export function sanitizeInputs(raw) {
  const d = { ...DEFAULTS, ...raw };
  const c2 = Math.max(0, Math.round(d.c2));
  const f2 = Math.max(0, Math.min(80, Number(d.f2)));
  const c4 = Math.max(1900, Math.min(2200, Math.round(d.c4)));
  const f4 = Math.max(-50, Math.min(50, Number(d.f4)));
  const f7 = Math.max(-50, Math.min(50, Number(d.f7)));
  const a22 = Math.max(-50, Math.min(50, Number(d.a22)));
  return { c2, f2, c4, f4, f7, a22 };
}

export function formatInr(n) {
  const x = Math.round(Number(n));
  return x.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

/**
 * Largest sensible Indian unit, up to 2 decimal places (trailing zeros trimmed).
 * Cr (≥1e7), lakhs (≥1e5), thousand (≥1e3), else plain amount.
 */
export function formatApproxInr(n) {
  const v = Math.abs(Number(n));
  if (!Number.isFinite(v)) return '';
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
export function formatApproxDisplay(n) {
  if (!Number.isFinite(n) || n <= 0) return '—';
  return '≈ ' + formatApproxInr(n);
}

export function getQueryParam(qs, cfg) {
  if (qs.has(cfg.name)) return qs.get(cfg.name);
  for (const a of cfg.aliases || []) {
    if (qs.has(a)) return qs.get(a);
  }
  return null;
}

export function encodeQuery(inputs) {
  const s = sanitizeInputs(inputs);
  const qs = new URLSearchParams();
  qs.set(SHARE_PARAM_CONFIG.c2.name, String(s.c2));
  qs.set(SHARE_PARAM_CONFIG.f2.name, String(s.f2));
  qs.set(SHARE_PARAM_CONFIG.c4.name, String(s.c4));
  qs.set(SHARE_PARAM_CONFIG.f4.name, String(s.f4));
  qs.set(SHARE_PARAM_CONFIG.f7.name, String(s.f7));
  return qs.toString();
}

export function decodeQuery() {
  const qs = new URLSearchParams(globalThis.location.search);
  const c2 = getQueryParam(qs, SHARE_PARAM_CONFIG.c2);
  const f2 = getQueryParam(qs, SHARE_PARAM_CONFIG.f2);
  const c4 = getQueryParam(qs, SHARE_PARAM_CONFIG.c4);
  const f4 = getQueryParam(qs, SHARE_PARAM_CONFIG.f4);
  const f7 = getQueryParam(qs, SHARE_PARAM_CONFIG.f7);
  const hasAny = c2 !== null || f2 !== null || c4 !== null || f4 !== null || f7 !== null;
  if (!hasAny) return null;
  return sanitizeInputs({ c2, f2, c4, f4, f7 });
}

export function updateUrlQuery(inputs) {
  const query = encodeQuery(inputs);
  const base = globalThis.location.pathname;
  const next = query ? base + '?' + query : base;
  if (history.replaceState) {
    history.replaceState(null, '', next);
  }
}

/** Legacy decode for old shared hash links (#v1...). */
export function decodeHash(str) {
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
    if (bin.length === 48) out.a22 = floats[5];
    return out;
  } catch {
    return null;
  }
}

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return sanitizeInputs(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveToStorage(inputs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeInputs(inputs)));
  } catch (_) {}
}

export function el(id) {
  return /** @type {HTMLElement} */ (document.getElementById(id));
}

