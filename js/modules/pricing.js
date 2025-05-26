//--- /js/modules/pricing.js (Issue #49) ---
// /js/modules/pricing.js
// Fetches pricing data from server and renders Packages & À La Carte tables

document.addEventListener('DOMContentLoaded', () => {
  const packagesBody = document.getElementById('packages-body');
  const alaCarteBody = document.getElementById('ala-carte-body');

  if (!packagesBody || !alaCarteBody) return;

  fetch('/php/get_pricing.php')
    .then(res => {
      if (!res.ok) throw new Error('Failed to load pricing data');
      return res.json();
    })
    .then(items => {
      // items is an array of {service, description, price, unit, is_package}
      const packages = items.filter(item => Number(item.is_package) === 1);
      const alaCarte = items.filter(item => Number(item.is_package) === 0);

      // Render Packages
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

      // Render À La Carte
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
      const msg = '<tr><td colspan="3">Error loading pricing.</td></tr>';
      packagesBody.innerHTML = msg;
      alaCarteBody.innerHTML = msg;
    });

  function formatPrice(price, unit) {
    const amt = typeof price === 'number'
      ? `$${price.toFixed(2)}`
      : price;
    return unit ? `${amt} ${unit}` : amt;
  }
});