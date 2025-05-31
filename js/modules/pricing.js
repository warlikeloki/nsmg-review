// File: /js/modules/pricing.js
// Table‐based renderer that handles either `service` or `name` from the JSON.

export async function loadPricing() {
  const pkgBody = document.getElementById('packages-body');
  const alaBody = document.getElementById('ala-carte-body');
  if (!pkgBody || !alaBody) return; // If these <tbody> elements are missing, do nothing

  try {
    const res = await fetch('/php/get_pricing.php');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const items = await res.json(); // Expecting an array

    // Determine which property holds the service title ("service" vs "name")
    // We’ll check the first item:
    const keyName = items.length > 0 && items[0].hasOwnProperty('service')
      ? 'service'
      : 'name';

    // Split into packages vs à la carte
    const packages   = items.filter(i => Number(i.is_package) === 1);
    const alaCarte   = items.filter(i => Number(i.is_package) === 0);

    // Helper to get either item.service or item.name
    const getTitle = i => (i[keyName] ?? '').trim();

    // Populate Packages table
    if (packages.length) {
      pkgBody.innerHTML = packages.map(item => `
        <tr>
          <td>${getTitle(item)}</td>
          <td>${item.description || ''}</td>
          <td>${formatPrice(item.price, item.unit)}</td>
        </tr>
      `).join('');
    } else {
      pkgBody.innerHTML = '<tr><td colspan="3">No packages available.</td></tr>';
    }

    // Populate À La Carte table
    if (alaCarte.length) {
      alaBody.innerHTML = alaCarte.map(item => `
        <tr>
          <td>${getTitle(item)}</td>
          <td>${item.description || ''}</td>
          <td>${formatPrice(item.price, item.unit)}</td>
        </tr>
      `).join('');
    } else {
      alaBody.innerHTML = '<tr><td colspan="3">No à la carte services available.</td></tr>';
    }

  } catch (err) {
    console.error('Pricing load error:', err);
    const errorMsg = '<tr><td colspan="3">Error loading pricing.</td></tr>';
    pkgBody.innerHTML = errorMsg;
    alaBody.innerHTML = errorMsg;
  }
}

// Auto‐invoke loadPricing() when page loads (if the <tbody> exists)
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('packages-body')) {
    loadPricing();
  }
});

function formatPrice(price, unit) {
  const amt = !isNaN(parseFloat(price))
    ? `$${parseFloat(price).toFixed(2)}`
    : price;
  return unit ? `${amt} ${unit}` : amt;
}

// Expose for potential later use (Services dashboard integration)
window.loadPricing = loadPricing;
