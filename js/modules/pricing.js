// /js/modules/pricing.js
// Issue #46 & #49: Expose loadPricing() to fetch and render pricing tables

export async function loadPricing() {
  const pkgBody    = document.getElementById('packages-body');
  const alaBody    = document.getElementById('ala-carte-body');
  if (!pkgBody || !alaBody) return;

  try {
    const res = await fetch('/php/get_pricing.php');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = await res.json();

    // Split packages vs á la carte
    const packages = items.filter(i => Number(i.is_package) === 1);
    const alaCarte = items.filter(i => Number(i.is_package) === 0);

    pkgBody.innerHTML = packages.length
      ? packages.map(i => `
        <tr>
          <td>${i.service}</td>
          <td>${i.description || ''}</td>
          <td>${formatPrice(i.price, i.unit)}</td>
        </tr>`).join('')
      : '<tr><td colspan="3">No packages available.</td></tr>';

    alaBody.innerHTML = alaCarte.length
      ? alaCarte.map(i => `
        <tr>
          <td>${i.service}</td>
          <td>${i.description || ''}</td>
          <td>${formatPrice(i.price, i.unit)}</td>
        </tr>`).join('')
      : '<tr><td colspan="3">No à la carte services available.</td></tr>';

  } catch (err) {
    console.error('Pricing load error:', err);
    const msg = '<tr><td colspan="3">Error loading pricing.</td></tr>';
    pkgBody.innerHTML = msg;
    alaBody.innerHTML = msg;
  }
}

// Also load on page load in case user visits standalone pricing.html
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('packages-body')) {
    loadPricing();
  }
});

function formatPrice(price, unit) {
  const amt = typeof price === 'number'
    ? `$${price.toFixed(2)}`
    : price;
  return unit ? `${amt} ${unit}` : amt;
}

// Expose globally for services.html
window.loadPricing = loadPricing;
