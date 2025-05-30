// /js/modules/equipment.js
// --- /js/modules/equipment.js (Issue #46) ---
// Load and render equipment for a given service type via PHP endpoint

document.addEventListener('DOMContentLoaded', initEquipmentFilter);
window.loadEquipment = initEquipmentFilter;  // for dynamic reload

function initEquipmentFilter() {
  const container = document.getElementById('equipment-list');
  if (!container) return;

  const pageCategory = container.getAttribute('data-category');
  if (!pageCategory) return;

  fetch(`/php/get_equipment.php?category=${encodeURIComponent(pageCategory)}`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(items => {
      if (!Array.isArray(items) || items.length === 0) {
        container.innerHTML = '<p>No equipment listed for this category.</p>';
        return;
      }

      // Group items by "category" field
      const grouped = {};
      items.forEach(item => {
        const key = item.category || 'Uncategorized';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
      });

      // Clear and render
      container.innerHTML = '';
      Object.keys(grouped).sort().forEach(cat => {
        const sec = document.createElement('section');
        sec.className = 'equipment-category';

        const hdr = document.createElement('h3');
        hdr.textContent = capitalize(cat);
        sec.appendChild(hdr);

        const ul = document.createElement('ul');
        ul.className = 'equipment-ul';

        grouped[cat].forEach(item => {
          const li = document.createElement('li');
          li.className = 'equipment-item';
          li.innerHTML = `
  <div class="item-header">
    <span class="toggle-icon">+</span> ${item.name}
  </div>
  <div class="item-description">${item.description || 'No description available.'}</div>
`;
          li.addEventListener('click', () => {
            li.classList.toggle('expanded');
            const icon = li.querySelector('.toggle-icon');
            icon.textContent = li.classList.contains('expanded') ? '−' : '+';
          });
          ul.appendChild(li);
        });

        sec.appendChild(ul);
        container.appendChild(sec);
      });
    })
    .catch(err => {
      console.error('Equipment load error:', err);
      container.innerHTML = '<p>Error loading equipment list.</p>';
    });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
