// /js/modules/pricing.js
// NSM-159 — PHP-first pricing with robust payload coercion and JSON fallback.
/* eslint-disable no-console */

const ENDPOINTS = {
  php: '/php/get_pricing.php',
  jsonPrimary: '/json/pricing.json',
  jsonFallback: '/json/pricing.fallback.json'
};

const PHP_TIMEOUT_MS = 5000;
const JSON_TIMEOUT_MS = 4000;
const DEBUG_PREFIX = '[pricing]';

const qs = new URLSearchParams(location.search);
const previewHidden = qs.has('previewHidden');

/* -------------------- utilities -------------------- */

function fetchWithTimeout(url, ms, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, {
    cache: 'no-store',
    credentials: 'same-origin',
    headers: { 'Accept': 'application/json' },
    signal: controller.signal,
    ...options
  }).finally(() => clearTimeout(id));
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getCurrencyFormatter(code) {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: code || 'USD' }); }
  catch { return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }); }
}

function formatPrice(value, unit, fmt) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') {
    return `${fmt.format(value)}${unit ? ` ${unit}` : ''}`;
  }
  const s = String(value);
  if (/^\s*\d+(\.\d+)?\s*$/.test(s)) {
    const n = Number(s);
    return `${fmt.format(n)}${unit ? ` ${unit}` : ''}`;
  }
  return esc(s); // e.g., "Call for quote"
}

/* -------------------- coercion -------------------- */
/**
 * Accepts many server shapes and returns a standard object:
 * { currency: 'USD', packages: [...], services: [...] }
 * Returns null if definitely unusable (e.g., {error:...}).
 */
function coercePayload(input) {
  if (!input) return null;
  if (typeof input === 'object' && 'error' in input) return null;

  // helper: normalize a single row into {kind,name,desc,price,unit,hidden}
  const normalizeRow = (row, kind /* 'package'|'service' */) => {
    const name =
      row.Package ?? row.package ?? row.Name ?? row.name ??
      row.Title ?? row.title ?? row.Service ?? row.service ?? '';
    const desc = row.Description ?? row.description ?? row.desc ?? '';
    const rawPrice = (row.Price ?? row.price ?? row.amount ?? row.Amount ?? row.cost ?? row.Cost ?? row.price_text);
    const unit = row.unit ? String(row.unit) : '';
    const status = (row.status || '').toString().toLowerCase();
    const enabled = (typeof row.enabled === 'boolean') ? row.enabled
                   : (typeof row.enabled === 'number') ? row.enabled !== 0
                   : (row.visible !== false);
    const hidden = !enabled || status === 'hidden' || status === 'disabled' || status === 'inactive';

    return { kind, name: String(name ?? ''), desc: String(desc ?? ''), price: rawPrice, unit, hidden };
  };

  // CASE 1: Already in standard shape (any casing)
  const obj = (typeof input === 'object' && !Array.isArray(input)) ? input : {};
  const dataRoot = (obj.data && typeof obj.data === 'object') ? obj.data : obj; // support {data:{...}}
  const pk = dataRoot.packages || dataRoot.Packages;
  const sv = dataRoot.services || dataRoot.Services;
  if (Array.isArray(pk) || Array.isArray(sv)) {
    const currency = String((dataRoot.currency || obj.currency || 'USD')).toUpperCase();
    return {
      currency,
      packages: (Array.isArray(pk) ? pk : []).map(r => normalizeRow(r, 'package')),
      services: (Array.isArray(sv) ? sv : []).map(r => normalizeRow(r, 'service')),
    };
  }

  // CASE 2: Flat array with category/name/description/price(+/_text)
  const items = Array.isArray(input) ? input
              : Array.isArray(obj.items) ? obj.items
              : Array.isArray(obj.rows) ? obj.rows
              : null;
  if (Array.isArray(items)) {
    const currency = String((obj.currency || 'USD')).toUpperCase();
    const packages = [];
    const services = [];
    items.forEach(row => {
      const catRaw = (row.category || row.Category || '').toString().toLowerCase();
      const kind = (catRaw === 'package') ? 'package' : (catRaw === 'service' ? 'service' : (
        // fallback: infer by presence of specific keys
        ('Package' in row || 'package' in row) ? 'package' : 'service'
      ));
      const norm = normalizeRow(row, kind);
      if (kind === 'package') packages.push(norm);
      else services.push(norm);
    });
    return { currency, packages, services };
  }

  // If we get here, we can’t confidently use it
  return null;
}

/* -------------------- rendering -------------------- */

function filterForVisibility(rows) {
  if (previewHidden) {
    return rows.map(r => ({ ...r, previewBadge: r.hidden ? 'Hidden' : '' }));
  }
  return rows.filter(r => !r.hidden);
}

function renderTbody(tbodySelector, rows, currency) {
  const tbody = document.querySelector(tbodySelector);
  if (!tbody) return;

  const fmt = getCurrencyFormatter(currency);
  const filtered = filterForVisibility(rows);

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="3"><em>No items available.</em></td></tr>`;
    return;
  }

  const rowsHtml = filtered.map(r => {
    const badge = r.previewBadge ? ` <span class="badge-hidden" aria-label="Hidden">${esc(r.previewBadge)}</span>` : '';
    const priceStr = formatPrice(r.price, r.unit, fmt);
    return `<tr>
      <td>${esc(r.name)}${badge}</td>
      <td>${esc(r.desc)}</td>
      <td class="price-cell" style="text-align:right; white-space:nowrap;">${priceStr}</td>
    </tr>`;
  }).join('');

  tbody.innerHTML = rowsHtml;
}

function renderAll(std) {
  const currency = std.currency || 'USD';
  renderTbody('#packages-body', std.packages || [], currency);
  renderTbody('#ala-carte-body', (std.services || std['à_la_carte'] || []), currency);

  // Optional: style for Hidden badge when previewing
  if (previewHidden && !document.getElementById('pricing-hidden-badge-style')) {
    const style = document.createElement('style');
    style.id = 'pricing-hidden-badge-style';
    style.textContent = `
      .badge-hidden{display:inline-block;font-size:.75rem;line-height:1;padding:.15rem .35rem;border-radius:.35rem;border:1px solid #c99;color:#933;margin-left:.35rem;}
    `;
    document.head.appendChild(style);
  }
}

/* -------------------- main flow -------------------- */

async function getPricingDataSequential() {
  // 1) Try PHP endpoint first
  try {
    const res = await fetchWithTimeout(ENDPOINTS.php, PHP_TIMEOUT_MS);
    if (!res.ok) throw new Error(`PHP ${res.status} ${res.statusText}`);

    const raw = await res.json();
    const std = coercePayload(raw);
    if (!std) throw new Error('PHP payload invalid');

    console.info(`${DEBUG_PREFIX} using PHP endpoint`);
    return { std, source: 'php' };
  } catch (err) {
    console.warn(`${DEBUG_PREFIX} PHP failed; falling back to JSON.`, err);
  }

  // 2) Primary JSON
  try {
    const res = await fetchWithTimeout(ENDPOINTS.jsonPrimary, JSON_TIMEOUT_MS);
    if (!res.ok) throw new Error(`JSON primary ${res.status} ${res.statusText}`);
    const raw = await res.json();
    const std = coercePayload(raw);
    if (!std) throw new Error('JSON primary payload invalid');

    console.info(`${DEBUG_PREFIX} using JSON primary fallback`);
    return { std, source: 'jsonPrimary' };
  } catch (err) {
    console.warn(`${DEBUG_PREFIX} JSON primary failed; trying secondary.`, err);
  }

  // 3) Secondary JSON
  try {
    const res = await fetchWithTimeout(ENDPOINTS.jsonFallback, JSON_TIMEOUT_MS);
    if (!res.ok) throw new Error(`JSON fallback ${res.status} ${res.statusText}`);
    const raw = await res.json();
    const std = coercePayload(raw);
    if (!std) throw new Error('JSON fallback payload invalid');

    console.info(`${DEBUG_PREFIX} using JSON secondary fallback`);
    return { std, source: 'jsonFallback' };
  } catch (err) {
    console.error(`${DEBUG_PREFIX} All sources failed.`, err);
    return { std: null, source: 'none', error: err };
  }
}

export async function loadPricing() {
  const { std } = await getPricingDataSequential();
  if (!std) {
    renderTbody('#packages-body', [], 'USD');
    renderTbody('#ala-carte-body', [], 'USD');
    return;
  }
  renderAll(std);
}
