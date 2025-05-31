// File: /js/modules/pricing.js
// Table-based renderer that correctly unwraps `success/data` if needed.

export async function loadPricing() {
  const pkgBody = document.getElementById('packages-body');
  const alaBody = document.getElementById('ala-carte-body');
  if (!pkgBody || !alaBody) {
    // If either <tbody> is missing, do nothing
    return;
  }

  try {
    const res = await fetch('/php/get_pricing.php');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    // Parse JSON
    const json = await res.json();

    // Determine whether the response is an array or wrapped in { success, data }
    let rows;
    if (Array.isArray(json)) {
      // E.g. get_pricing.php returned [ {...}, {...}, … ]
      rows = json;
    } else if (json && Array.isArray(json.data)) {
      // E.g. get_pricing.php returned { success: true, data: [ {...}, … ] }
      rows = json.data;
    } else {
      throw new Error('Unexpected JSON structure from get_pricing.php');
    }

    // Now `rows` is definitely an array of objects with a "name" property

    // Split into packages (is_package == "1") vs à la carte (is_package == "0")
    const packages = rows.filter(item => Number(item.is_package) === 1);
    const alaCarte = rows.filter(item => Number(item.is_package) === 0);

    // Build Package rows
    if (packages.length) {
      pkgBody.innerHTML = packages.map(item => `
        <tr>
          <td>${item.name}</td>
          <td>${item.description || ''}</td>
          <td>${formatPrice(item.price, item.unit)}</td>
        </tr>
      `).join('');
    } else {
      pkgBody.innerHTML = '<tr><td colspan="3">No packages available.</td></tr>';
    }

    // Build À La Carte rows
    if (alaCarte.length) {
      alaBody.innerHTML = alaCarte.map(item => `
        <tr>
          <td>${item.name}</td>
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

// Automatically call loadPricing() when the page loads and #packages-body exists
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('packages-body')) {
    loadPricing();
  }
});

// Helper to format a number as currency, with an optional unit
function formatPrice(price, unit) {
  const amt = !isNaN(parseFloat(price))
    ? `$${parseFloat(price).toFixed(2)}`
    : price;
  return unit ? `${amt} ${unit}` : amt;
}

// Expose for potential future use (e.g., inside Services dashboard)
window.loadPricing = loadPricing;
