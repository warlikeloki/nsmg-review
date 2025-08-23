// /js/modules/equipment.js
// Flat, per-item accordion of equipment.
// - Filters by membership in CSV `category` (e.g., "photography, videography").
// - Each item header shows NAME only.
// - Expanded panel shows DESCRIPTION (and an image if thumbnail_url exists).
//
// How the page tells us which tag to filter by (priority):
//   1) URL: ?category=photography
//   2) <body data-category-filter="photography">
//   3) <section id="equipment-list" data-category="photography">
//
// Exposes window.loadEquipment() for /js/main.js. Also auto-runs.

(function () {
  if (window.loadEquipment) return; // idempotent

  // Build one accordion row (collapsed by default)
  function itemRow(e, idx) {
    const panelId = `eq-item-panel-${idx}`;
    const btnId   = `eq-item-toggle-${idx}`;

    // Only description + (future) small image; no category/condition/etc.
    const img = e.thumbnail_url
      ? `<img class="eq-thumb" src="${e.thumbnail_url}" alt="${e.name}" loading="lazy" decoding="async">`
      : '';

    const desc = e.description ? `<p class="eq-desc">${e.description}</p>` : '<p class="eq-desc">No description provided.</p>';

    return `
      <section class="equip-item">
        <h3 class="equip-item-header">
          <button id="${btnId}" class="equip-toggle" aria-expanded="false" aria-controls="${panelId}">
            <span class="equip-title">${e.name}</span>
            <span class="equip-caret" aria-hidden="true">▸</span>
          </button>
        </h3>
        <div id="${panelId}" class="equip-panel" role="region" aria-labelledby="${btnId}" hidden>
          <div class="equip-panel-inner">
            ${img}
            ${desc}
          </div>
        </div>
      </section>
    `;
  }

  async function fetchEquipment(paramsObj = {}) {
    const params = new URLSearchParams();
    if (paramsObj.category) params.set('category', paramsObj.category);
    if (paramsObj.q)        params.set('q', paramsObj.q);
    const url = '/php/get_equipment.php' + (params.toString() ? `?${params}` : '');
    const res = await fetch(url, { cache: 'no-store' });
    return res.json();
  }

  function wireToggles(container) {
    const toggles = Array.from(container.querySelectorAll('.equip-toggle'));
    toggles.forEach(btn => {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        panel.hidden = expanded;
        // rotate caret
        const caret = btn.querySelector('.equip-caret');
        if (caret) caret.textContent = expanded ? '▸' : '▾';
      });
      // keyboard nav between items
      btn.addEventListener('keydown', (e) => {
        if (!['ArrowUp','ArrowDown','Home','End'].includes(e.key)) return;
        const i = toggles.indexOf(btn);
        let next = i;
        if (e.key === 'ArrowUp') next = (i - 1 + toggles.length) % toggles.length;
        if (e.key === 'ArrowDown') next = (i + 1) % toggles.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = toggles.length - 1;
        toggles[next]?.focus();
        e.preventDefault();
      });
    });
  }

  function render(listEl, items) {
    if (!Array.isArray(items) || items.length === 0) {
      listEl.innerHTML = '<p>No equipment found.</p>';
      return;
    }
    // Sort by name, produce flat list
    const html = items
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((e, i) => itemRow(e, i))
      .join('');
    listEl.innerHTML = `<div class="equip-list-flat">${html}</div>`;
    wireToggles(listEl);
  }

  window.loadEquipment = async function loadEquipment() {
    const listEl = document.getElementById('equipment-list');
    if (!listEl) return;

    // Determine which category tag to filter by (e.g., "photography")
    const url = new URL(location.href);
    const urlCat  = url.searchParams.get('category') || '';
    const bodyCat = (document.body && document.body.dataset && document.body.dataset.categoryFilter) || '';
    const listCat = (listEl.dataset && listEl.dataset.category) || '';
    const tag = urlCat || bodyCat || listCat || '';

    // Optional search box (if you add one later)
    const qEl = document.getElementById('equipment-search');

    const readState = () => ({
      category: tag || undefined,
      q: (qEl && qEl.value) ? qEl.value.trim() : undefined
    });

    const apply = async () => {
      listEl.innerHTML = '<p>Loading equipment…</p>';
      try {
        const { category, q } = readState();
        const { success, data, error } = await fetchEquipment({ category, q });
        if (!success) throw new Error(error || 'Failed to load equipment');
        render(listEl, data);
      } catch (e) {
        console.error(e);
        listEl.innerHTML = '<p class="error">Unable to load equipment.</p>';
      }
    };

    await apply();

    if (qEl) {
      let t;
      qEl.addEventListener('input', () => { clearTimeout(t); t = setTimeout(apply, 300); });
    }
  };

  // Auto-run when hook exists
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('equipment-list')) window.loadEquipment();
    }, { once: true });
  } else if (document.getElementById('equipment-list')) {
    window.loadEquipment();
  }
})();
