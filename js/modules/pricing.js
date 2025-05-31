// File: /js/modules/pricing.js
// Option A: Table‐Based Pricing Renderer

export async function loadPricing() {
  // Get references to the <tbody> elements
  const pkgBody = document.getElementById('packages-body');
  const alaBody = document.getElementById('ala-carte-body');
  if (!pkgBody || !alaBody) {
    // If either table body is missing, do nothing
    return;
  }

  try {
    const res = await fetch('/php/get_pricing.php');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    // The endpoint should return a JSON array of objects
    const items = await res.json();

    // Split items into packages (is_package == 1) vs à la carte (is_package == 0)
    const packages = items.filter(i => Number(i.is_package) === 1);
    const alaCarte = items.filter(i => Number(i.is_package) === 0);

    // Populate the Packages table
    if (packages.length) {
      pkgBody.innerHTML = packages.map(item => `
        <tr>
          <td>${item.service}</td>
          <td>${item.description || ''}</td>
          <td>${formatPrice(item.price, item.unit)}</td>
        </tr>
      `).join('');
    } else {
      pkgBody.innerHTML = '<tr><td colspan="3">No packages available.</td></tr>';
    }

    // Populate the À La Carte table
    if (alaCarte.length) {
      alaBody.innerHTML = alaCarte.map(item => `
        <tr>
          <td>${item.service}</td>
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

// If the user visits pricing.html directly, auto‐invoke loadPricing()
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('packages-body')) {
    loadPricing();
  }
});

// Helper to format a numeric price and optional unit
function formatPrice(price, unit) {
  // If price is a number, format with two decimals and a leading $
  const amt = !isNaN(parseFloat(price))
    ? `$${parseFloat(price).toFixed(2)}`
    : price;
  return unit ? `${amt} ${unit}` : amt;
}

// In case you ever want to trigger from another page (e.g. Services Dashboard),
// expose loadPricing() on window
window.loadPricing = loadPricing;
