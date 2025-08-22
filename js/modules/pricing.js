// /js/modules/pricing.js
// Works with normalized schema (services + pricing) where /php/get_pricing.php
// returns: { success: true, data: { packages: [...], alacarte: [...] } }.
//
// Exports a named function `loadPricing()` so /js/main.js can import and invoke it.
// Also auto-runs safely if imported/loaded without main.js calling it.
// Idempotent: multiple calls won't double-render.

let __ran = false;

const usd = (n) => {
  if (n == null || n === '') return '';
  const num = Number(n);
  return Number.isFinite(num)
    ? num.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    : String(n);
};

const setLoading = (pkgBody, alaBody) => {
  const r = '<tr><td colspan="3">Loading prices...</td></tr>';
  pkgBody.innerHTML = r;
  alaBody.innerHTML = r;
};

const setError = (pkgBody, alaBody, msg) => {
  const r = `<tr><td colspan="3" class="error">${msg}</td></tr>`;
  pkgBody.innerHTML = r;
  alaBody.innerHTML = r;
};

const renderRows = (tbody, items) => {
  if (!Array.isArray(items) || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3">No items</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(r => `
    <tr>
      <td>${r.name ?? ''}</td>
      <td>${r.description ?? ''}</td>
      <td>${usd(r.price)}</td>
    </tr>
  `).join('');
};

export async function loadPricing() {
  if (__ran) return; // idempotent
  const pkgBody = document.getElementById('packages-body');
  const alaBody = document.getElementById('ala-carte-body');
  if (!pkgBody || !alaBody) return; // not on pricing page

  __ran = true;
  try {
    setLoading(pkgBody, alaBody);
    const res = await fetch('/php/get_pricing.php', { cache: 'no-store' });
    const json = await res.json();
    if (!json?.success || !json?.data) {
      setError(pkgBody, alaBody, json?.error || 'Failed to load pricing.');
      return;
    }
    const { packages = [], alacarte = [] } = json.data;
    renderRows(pkgBody, packages);
    renderRows(alaBody, alacarte);
  } catch (err) {
    console.error(err);
    setError(pkgBody, alaBody, 'Unable to fetch pricing at this time.');
  }
}

// Auto-run if the elements are already on the page and main.js doesn't call us.
// (Safe due to idempotent guard.)
const autoRunIfReady = () => {
  const pkgBody = document.getElementById('packages-body');
  const alaBody = document.getElementById('ala-carte-body');
  if (pkgBody && alaBody) {
    loadPricing();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoRunIfReady, { once: true });
} else {
  autoRunIfReady();
}
