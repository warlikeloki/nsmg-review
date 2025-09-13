// /js/modules/pricing.js
// NSM-159/160 — Robust Pricing loader with PHP-first, JSON fallback, and shape-agnostic parsing.

const API_URL = '/php/get_pricing.php';
const JSON_URL = '/json/pricing.json';

function $(sel, root = document) { return root.querySelector(sel); }

function usd(n) {
  if (n === null || n === undefined || isNaN(Number(n))) return '';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n));
  } catch {
    return `$${Number(n).toFixed(2)}`;
  }
}

async function getJson(url) {
  const res = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.json();
}

/** Detects our canonical PHP payload: {packages:[], alaCarte:[] } */
function looksLikePhpPayload(x) {
  return x && Array.isArray(x.packages) && Array.isArray(x.alaCarte);
}

/** Some older JSONs might be a flat array or {items:[...]} with keys in different cases. */
function normalizeToSections(payload) {
  // Case 1: canonical
  if (looksLikePhpPayload(payload)) {
    return {
      packages: payload.packages.map(normalizeItem),
      alaCarte: payload.alaCarte.map(normalizeItem),
    };
  }

  // Case 2: { items: [...] } or plain array
  const items = Array.isArray(payload) ? payload
             : Array.isArray(payload?.items) ? payload.items
             : [];

  const norm = items.map(normalizeItem);
  const packages = norm.filter(i => i.isPackage === true);
  const alaCarte = norm.filter(i => i.isPackage === false);

  return { packages, alaCarte };
}

/** Accepts multiple key styles and returns a consistent item shape */
function normalizeItem(row = {}) {
  const name = row.service ?? row.Service ?? row.name ?? '';
  const desc = row.description ?? row.Description ?? '';
  const unit = row.unit ?? row.Unit ?? null;

  // price may already be formatted (Price, PriceDisplay), prefer numeric if present
  const priceRaw = row.price ?? row.Price ?? null;
  const priceDisp = row.PriceDisplay ?? null;
  const price = (priceRaw === null || priceRaw === undefined || priceRaw === '')
    ? null
    : Number(priceRaw);

  // package flag could be boolean, 0/1, "1", or missing; treat missing as false
  const isPkg =
    (typeof row.isPackage === 'boolean') ? row.isPackage :
    (row.is_package !== undefined) ? (Number(row.is_package) === 1) :
    (row.IsPackage !== undefined) ? Boolean(row.IsPackage) :
    false;

  // visibility may come from backend; default visible if unspecified
  const isVisible =
    (row.isVisible !== undefined) ? Boolean(row.isVisible) :
    (row.is_visible !== undefined) ? (Number(row.is_visible) === 1) : true;

  return {
    service: String(name || '').trim(),
    description: String(desc || '').trim(),
    unit: unit ? String(unit).trim() : null,
    price,                       // numeric or null
    priceDisplay: priceDisp || null, // optional preformatted
    isPackage: !!isPkg,
    isVisible: !!isVisible,
  };
}

function clearBody(tbody) {
  while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
}

function rowHtml(item) {
  const name = item.service || '';
  const desc = item.description || '';
  const priceText = item.priceDisplay || usd(item.price) || '';
  const unitText = item.unit ? ` ${item.unit}` : '';

  const priceCell = (priceText || unitText)
    ? `${priceText}${unitText ? `<span class="unit">${unitText}</span>` : ''}`
    : '—';

  return `
    <tr>
      <td>${escapeHtml(name)}</td>
      <td>${escapeHtml(desc)}</td>
      <td>${priceCell}</td>
    </tr>
  `;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderTable(tbodyId, items) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  clearBody(tbody);

  const visible = (items || []).filter(i => i && i.isVisible !== false);
  if (!visible.length) {
    tbody.innerHTML = `<tr><td colspan="3">No items available.</td></tr>`;
    return;
  }

  tbody.innerHTML = visible.map(rowHtml).join('');
}

async function getPricingPreferPhp() {
  // 1) Try PHP
  try {
    const php = await getJson(API_URL);
    if (looksLikePhpPayload(php)) {
      console.info('[pricing] using PHP payload');
      return normalizeToSections(php);
    } else {
      console.warn('[pricing] PHP payload unexpected shape; will try JSON fallback');
      // fall through to JSON
    }
  } catch (e) {
    console.warn('[pricing] PHP failed; will try JSON fallback. Error:', e);
  }

  // 2) Fallback JSON
  const j = await getJson(JSON_URL);
  const norm = normalizeToSections(j);
  console.info('[pricing] using JSON fallback');
  return norm;
}

export async function loadPricing() {
  try {
    const data = await getPricingPreferPhp();
    renderTable('packages-body', data.packages);
    renderTable('ala-carte-body', data.alaCarte);
  } catch (e) {
    console.error('[pricing] fatal error rendering pricing:', e);
    // graceful failure: show a terse message if DOM nodes exist
    const pb = $('#packages-body'), ab = $('#ala-carte-body');
    if (pb) pb.innerHTML = `<tr><td colspan="3">Pricing unavailable.</td></tr>`;
    if (ab) ab.innerHTML = `<tr><td colspan="3">Pricing unavailable.</td></tr>`;
  }
}
