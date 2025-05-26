// js/pricing.js

document.addEventListener('DOMContentLoaded', () => {
  const packagesBody   = document.getElementById('packages-body');
  const alaCarteBody   = document.getElementById('ala-carte-body');

  if (!packagesBody || !alaCarteBody) return;

  fetch('/php/get_pricing.php')
    .then(res => {
      if (!res.ok) throw new Error('Failed to load pricing data');
      return res.json();
    })
    .then(items => {
      // Split into packages vs à la carte
      const packages = items.filter(item => parseInt(item.is_package, 10) === 1);
      const alaCarte = items.filter(item => parseInt(item.is_package, 10) === 0);

      // Render Packages table
      if (packages.length) {
        packagesBody.innerHTML = packages.map(item => `
          <tr>
            <td>${item.service}</td>
            <td>${item.description || ''}</td>
            <td>${formatPrice(item.price, item.unit)}</td>
          </tr>
        `).join('');
      } else {
        packagesBody.innerHTML = '<tr><td colspan="3">No packages available.</td></tr>';
      }

      // Render À La Carte table
      if (alaCarte.length) {
        alaCarteBody.innerHTML = alaCarte.map(item => `
          <tr>
            <td>${item.service}</td>
            <td>${item.description || ''}</td>
            <td>${formatPrice(item.price, item.unit)}</td>
          </tr>
        `).join('');
      } else {
        alaCarteBody.innerHTML = '<tr><td colspan="3">No à la carte services available.</td></tr>';
      }
    })
    .catch(err => {
      console.error('Pricing load error:', err);
      packagesBody.innerHTML = '<tr><td colspan="3">Error loading pricing.</td></tr>';
      alaCarteBody.innerHTML = '<tr><td colspan="3">Error loading pricing.</td></tr>';
    });

  // Helper to format price + unit
  function formatPrice(price, unit) {
    const amt = typeof price === 'number'
      ? `$${price.toFixed(2)}`
      : price;
    return unit ? `${amt} ${unit}` : amt;
  }
});
