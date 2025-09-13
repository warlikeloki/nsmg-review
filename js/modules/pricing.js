// /js/modules/pricing.js
// NSM-159 — PHP-first pricing with JSON-only fallback.
// Populates only the TBODYs already present in pricing.html:
//   #packages-body  and  #ala-carte-body
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

async function getPricingDataSequential() {
  // 1) Try PHP endpoint first
  try {
    const res = await fetchWithTimeout(ENDPOINTS.php, PHP_TIMEOUT_MS);
    if (!res.ok) throw new Error(`PHP ${res.status} ${res.statusText}`);
    const data = await res.json();
    if (!isValidPayload(data)) throw new Error('PHP payload invalid');
    console.info(`${DEBUG_PREFIX} using PHP endpoint`);
    return { data, source: 'php' };
  } catch (err) {
    console.warn(`${DEBUG_PREFIX} PHP failed; falling back to JSON.`, err);
  }

  // 2) Primary JSON
  try {
    const res = await fetchWithTimeout(ENDPOINTS.jsonPrimary, JSON_TIMEOUT_MS);
    if (!res.ok) throw new Error(`JSON primary ${res.status} ${res.statusText}`);
    const data = await res.json();
    if (!isValidPayload(data)) throw new Error('JSON primary payload invalid');
    console.info(`${DEBUG_PREFIX} using JSON primary fallback`);
    return { data, source: 'jsonPrimary' };
  } catch (err) {
    console.warn(`${DEBUG_PREFIX} JSON primary failed; trying secondary.`, err);
  }

  // 3) Secondary JSON
  try {
    const res = await fetchWithTimeout(ENDPOINTS.jsonFallback, JSON_TIMEOUT_MS);
    if (!res.ok) throw new Error(`JSON fallback ${res.status} ${res.statusText}`);
    const data = await res.json();
    if (!isValidPayload(data)) throw new Error('JSON fallback payload invalid');
    console.info(`${DEBUG_PREFIX} using JSON secondary fallback`);
    return { data, source: 'jsonFallback' };
  } catch (err) {
    console.error(`${DEBUG_PREFIX} All sources failed.`, err);
    return { data: null, source: 'none', error: err };
  }
}

function isValidPayload(obj) {
  if (!obj || typeof obj !== 'object') return false;
  const pkOk = Array.isArray(obj.packages);
  const svOk = Array.isArray(obj.services);
  return pkOk || svOk;
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

function normalizeRow(row, kind /* 'package' | 'service' */) {
  const name = row.Package ?? row.package ?? row.Name ?? row.name ?? row.Title ?? row.title ?? row.Service ?? row.service ?? '';
  const desc = row.Description ?? row.description ?? row.desc ?? '';
  const rawPrice = (row.Price ?? row.price ?? row.amount ?? row.Amount ?? row.cost ?? row.Cost);
  const unit = row.unit ? String(row.unit) : '';
  const status = (row.status || '').toString().toLowerCase();
  const enabled = (typeof row.enabled === 'boolean') ? row.enabled : (row.visible !== false);
  const hidden = !enabled || status === 'hidden' || status === 'disabled' || status === 'inactive';

  return {
    kind,
    name: String(name ?? ''),
    desc: String(desc ?? ''),
    price: rawPrice,
    unit,
    hidden
  };
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

function normalizePayload(data) {
  const currency = (data.currency || 'USD').toString().toUpperCase();
  const packages = Array.isArray(data.packages) ? data.packages.map(r => normalizeRow(r, 'package')) : [];
  const services = Array.isArray(data.services) ? data.services.map(r => normalizeRow(r, 'service')) : [];
  return { currency, packages, services };
}

export async function loadPricing() {
  const { data } = await getPricingDataSequential();

  if (!data) {
    renderTbody('#packages-body', [], 'USD');
    renderTbody('#ala-carte-body', [], 'USD');
    return;
  }

  const { currency, packages, services } = normalizePayload(data);
  renderTbody('#packages-body', packages, currency);
  renderTbody('#ala-carte-body', services, currency);

  // Optional: tiny style for Hidden badge if previewing
  if (previewHidden && !document.getElementById('pricing-hidden-badge-style')) {
    const style = document.createElement('style');
    style.id = 'pricing-hidden-badge-style';
    style.textContent = `
      .badge-hidden{display:inline-block;font-size:.75rem;line-height:1;padding:.15rem .35rem;border-radius:.35rem;border:1px solid #c99;color:#933;margin-left:.35rem;}
    `;
    document.head.appendChild(style);
  }
}
